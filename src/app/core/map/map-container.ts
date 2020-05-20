import * as PIXI from 'pixi.js';
import { Creature } from 'src/app/shared/models/creature';
import { Map } from 'src/app/shared/models/map';
import { Layer } from './layers/layer';
import { GridLayer } from './layers/grid-layer';
import { BackgroundLayer } from './layers/background-layer';
import { TokensLayer } from './layers/tokens-layer';
import { Grid } from './models/grid';
import { VisionLayer } from './layers/vision-layer';
import { LightsLayer } from './layers/lights-layer';
import { DataService } from 'src/app/shared/services/data.service';
import { AppState } from 'src/app/shared/models/app-state';
import { TokenView } from './views/token-view';
import { Tile } from 'src/app/shared/models/tile';
import { TilesLayer } from './layers/tiles-layer';
import { AreaEffectsLayer } from './layers/area-effects-layer';
import { AreaEffectView } from './views/area-effect-view';
import { TileView } from './views/tile-view';
import { AurasLayer } from './layers/auras-layer';
import { FogLayer } from './layers/fog-layer';
import { EffectsLayer } from './layers/effects-layer';
import { DrawingsLayer } from './layers/drawings-layer';
import { MarkersLayer } from './layers/markers-layer';
import { MarkerView } from './views/marker-view';

export class MapContainer extends Layer {

    backgroundLayer: BackgroundLayer;
    gridLayer: GridLayer;
    canvasLayer: Layer;
    areaEffectsLayer: AreaEffectsLayer;
    monstersLayer: TokensLayer;
    playersLayer: TokensLayer;

    topLayer: TilesLayer;
    middleLayer: TilesLayer;
    bottomLayer: TilesLayer;

    aurasLayer: AurasLayer;
    visionLayer: VisionLayer;
    fogLayer: FogLayer;
    lightsLayer: LightsLayer;
    effectsLayer: EffectsLayer;
    drawingsLayer: DrawingsLayer;
    markersLayer: MarkersLayer;

    // data
    map: Map;
    state: AppState;
    grid: Grid = new Grid();

    data: PIXI.interaction.InteractionData;
    dragging: boolean;

    turned: TokenView;
    tiles: Array<Tile> = [];

    constructor(private dataService: DataService) {
        super();

        this.backgroundLayer = this.addChild(new BackgroundLayer(this.dataService));
        this.bottomLayer = this.addChild(new TilesLayer(this.dataService));
        this.gridLayer = this.addChild(new GridLayer());
        this.middleLayer = this.addChild(new TilesLayer(this.dataService));
        this.lightsLayer = this.addChild(new LightsLayer(this.dataService));
        this.aurasLayer = this.addChild(new AurasLayer(this.dataService));
        this.topLayer = this.addChild(new TilesLayer(this.dataService));
        this.drawingsLayer = this.addChild(new DrawingsLayer(this.dataService));
        this.areaEffectsLayer = this.addChild(new AreaEffectsLayer(this.dataService));
        this.markersLayer = this.addChild(new MarkersLayer(this.dataService));
        this.monstersLayer = this.addChild(new TokensLayer(this.dataService));
        this.visionLayer = this.addChild(new VisionLayer(this.dataService));
        this.fogLayer = this.addChild(new FogLayer());
        this.effectsLayer = this.addChild(new EffectsLayer(this.dataService));
        this.playersLayer = this.addChild(new TokensLayer(this.dataService));
    }

    update(state: AppState) {
        this.state = state;

        console.debug("updating map");
        this.map = this.state.map;

        if (this.map == null) {
            return;
        }

        this.backgroundLayer.update(this.state.map);

        // update grid
        this.grid.update(this.state.map);
        this.gridLayer.update(this.grid);

        this.lightsLayer.update();
        this.visionLayer.update();
        this.fogLayer.update(this.state.map);
        
        this.monstersLayer.grid = this.grid;
        this.playersLayer.grid = this.grid;

        this.monstersLayer.creatures = this.state.mapMonsters;
        this.playersLayer.creatures = this.state.mapPlayers;
        
        this.areaEffectsLayer.update();
        this.areaEffectsLayer.grid = this.grid;

        this.drawingsLayer.update();

        this.effectsLayer.grid = this.grid;

        this.markersLayer.grid = this.grid;
        this.markersLayer.update();

        this.tiles = state.map.tiles;
    }

    updateTiles(tiles: Array<Tile>) {
        this.tiles = tiles;
    }

    updateTurned(creature: Creature) {
        if (this.turned != null) {
            this.turned.turned = false;
            this.turned.updateUID();
            this.turned.updateInteraction();
        }

        this.turned = this.tokenByCreature(creature);
        if (this.turned != null) {
            this.turned.turned = true
            this.turned.updateUID();
            this.turned.updateInteraction();
        }
    }

    updateInteraction() {
        console.log(`updating interaction`);

        for (let view of this.playersLayer.views) {
            view.updateInteraction();
        }

        for (let view of this.monstersLayer.views) {
            view.updateInteraction();
        }
    }

    async drawTiles() {
        this.bottomLayer.tiles = this.tiles.filter(tile => tile.layer == "map");
        this.middleLayer.tiles = this.tiles.filter(tile => tile.layer == "object");
        this.topLayer.tiles = this.tiles.filter(tile => tile.layer == "token");

        await this.bottomLayer.draw();
        await this.middleLayer.draw();
        await this.topLayer.draw();
    }

    async draw() {
        await this.backgroundLayer.draw();

        this.w = this.backgroundLayer.w;
        this.h = this.backgroundLayer.h;

        // update size for all layers
        for(let layer of this.children) {
            if (layer instanceof Layer) {
                layer.w = this.w;
                layer.h = this.h;
            }
        }

        // vision
        await this.visionLayer.draw();
        await this.fogLayer.draw();

        await this.gridLayer.draw();
        await this.lightsLayer.draw();

        await this.monstersLayer.draw();
        
        await this.playersLayer.draw();
        this.aurasLayer.tokens = this.playersLayer.views;
        this.aurasLayer.draw();
        await this.drawTiles();

        await this.areaEffectsLayer.draw();

        await this.markersLayer.draw();

        await this.drawingsLayer.draw();

        await this.effectsLayer.draw();

        this.hitArea = new PIXI.Rectangle(0, 0, this.w, this.h);

        return this;
    }

    tokenByCreature(creature: Creature): TokenView {
        if (creature) {
            return this.tokenByCreatureId(creature.id)
        } else {
            return null;
        }
    }

    tokenByCreatureId(creatureId: string): TokenView {

        for (let view of this.playersLayer.views) {
            if (view.creature.id == creatureId) {
                return view;
            }
        }

        for (let view of this.monstersLayer.views) {
            if (view.creature.id == creatureId) {
                return view;
            }
        }

        return null;
    }

    areaEffectViewById(id: string): AreaEffectView {
        for (let view of this.areaEffectsLayer.views) {
            if (view.areaEffect.id == id) {
                return view;
            }
        }
        return null;
    }

    tileViewById(id: string): TileView {
        for (let view of this.topLayer.views) {
            if (view.tile.id == id) {
                return view;
            }
        }
        for (let view of this.middleLayer.views) {
            if (view.tile.id == id) {
                return view;
            }
        }

        for (let view of this.bottomLayer.views) {
            if (view.tile.id == id) {
                return view;
            }
        }
        return null;
    }

    markerViewById(id: string): MarkerView {
        for (let view of this.markersLayer.views) {
            if (view.marker.id == id) {
                return view;
            }
        }
        return null;
    }
}