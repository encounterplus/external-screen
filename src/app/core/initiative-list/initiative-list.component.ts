import { Component, OnInit, Input, ElementRef, IterableDiffers } from '@angular/core';
import { AppState } from 'src/app/shared/models/app-state';
import { Creature } from 'src/app/shared/models/creature';
import { Lightbox, IAlbum } from 'ngx-lightbox';
import { DataService } from 'src/app/shared/services/data.service';

@Component({
  selector: 'app-initiative-list',
  templateUrl: './initiative-list.component.html',
  styleUrls: ['./initiative-list.component.scss']
})
export class InitiativeListComponent implements OnInit {

  @Input() 
  public state: AppState;

  constructor(private element: ElementRef, private lightbox: Lightbox, private dataService: DataService) { 
  }

  get activeCreatures(): Array<Creature> {
    return this.state.game.creatures.filter( creature => { return creature.initiative != -10 } ).sort((a, b) => (a.rank > b.rank) ? 1 : -1)
  }

  get images(): Array<IAlbum> {
    let images: Array<IAlbum>  = [];
    for (let creature of this.activeCreatures) {
      images.push({src:  `http://${this.dataService.remoteHost}${creature.image}`, caption: null, thumb: null});
    }
    return images;
  }

  ngOnInit(): void {
  }

  ngAfterViewChecked(): void {
    // console.debug("view checked");
  }

  ngAfterViewInit(): void {
    this.scrollToTurned();
  }

  scrollToTurned() {
    // scroll to turned element
    console.debug(this.state.turnedId);
    let selector = `[data-id="${this.state.turnedId}"]`;
    let el = this.element.nativeElement.querySelector(selector);
    if (el) {
      el.scrollIntoView();
    }
  }

  open(index: number): void {
    // open lightbox
    this.lightbox.open(this.images, index);
  }

  close(): void {
    // close lightbox programmatically
    this.lightbox.close();
  }
}