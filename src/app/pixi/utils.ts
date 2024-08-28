import * as PIXI from 'pixi.js';

export class PixiUtils {
  private constructor() {
  }

  static getDistance(point1: PIXI.Point, point2: PIXI.Point) {
    const a = point1.x - point2.x;
    const b = point1.y - point2.y;
    return Math.sqrt(a * a + b * b);
  }

  // pseudo-random number generator
  // https://stackoverflow.com/a/47593316
  static splitMix32(a: number) {
    return () => {
      a |= 0;
      a = a + 0x9e3779b9 | 0;
      let t = a ^ a >>> 16;
      t = Math.imul(t, 0x21f0aaad);
      t = t ^ t >>> 15;
      t = Math.imul(t, 0x735a2d97);
      return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
    }
  }

  static shuffle(objects: any[], random: () => number) {
    for (let i = objects.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [objects[i], objects[j]] = [objects[j], objects[i]];
    }
  }

  static async readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target?.result as string)
      }
      reader.onerror = (event) => {
        reject(event.target?.error)
      }
      reader.readAsDataURL(file)
    })
  }
}



