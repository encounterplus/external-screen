import { View } from './view';
import { Grid } from '../models/grid';
import { Loader } from '../models/loader';
import { DataService } from 'src/app/shared/services/data.service';
import { Tile } from 'src/app/shared/models/tile';
import { TilesLayer } from '../layers/tiles-layer';
import { MapLayer } from 'src/app/shared/models/map';

export class TileView extends View {

    tile: Tile;
    grid: Grid;

    assetTexture: PIXI.Texture;
    assetSprite: PIXI.Sprite;

    mapLayer: MapLayer = MapLayer.object;

    constructor(tile: Tile, grid: Grid) {
        super();
        this.tile = tile;
        this.grid = grid;
    }

    async draw() {
        this.clear()
        this.update();

        await this.drawAsset()
        return this;
    }

    async drawAsset() {
        // texture
        if (this.tile.asset.resource != null) {
            this.assetTexture = await Loader.shared.loadTexture(this.tile.asset.resource);
        } else {
            return this;
        }

        // sprite
        if (this.assetTexture != null) {
            let sprite = new PIXI.Sprite(this.assetTexture);
            sprite.anchor.set(0.5, 0.5);
            sprite.width = this.tile.width;
            sprite.height = this.tile.height;
            sprite.angle = this.tile.rotation;
            this.assetSprite = this.addChild(sprite);
        }

        return this;
    }

    update() {

        this.w = this.tile.width;
        this.h = this.tile.height;

        this.position.set(this.tile.x, this.tile.y)
        this.hitArea = new PIXI.Rectangle(0, 0, this.w, this.h);
        this.zIndex = this.tile.zIndex;

        this.visible = !this.tile.hidden;
        this.mapLayer = this.tile.layer;
    }

    clear() {
        this.removeChildren();
    }
}