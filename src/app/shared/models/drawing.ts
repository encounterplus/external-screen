import { MapLayer } from './map';

export enum DrawingShape {
    line = "line",
    rectangle = "rectangle",
    circle = "circle"
}

export class Drawing {
    shape: DrawingShape = DrawingShape.line;
    data: Array<number> = [];
    layer: MapLayer;
    strokeWidth: number;
    strokeColor: string;
    fillColor: string;
    opacity: number;
}