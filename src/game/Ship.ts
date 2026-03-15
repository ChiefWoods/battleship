export class Ship {
  public readonly id: string;
  public readonly length: number;
  private hits: number;

  public constructor(id: string, length: number) {
    this.id = id;
    this.length = length;
    this.hits = 0;
  }

  public hit(): void {
    if (this.hits < this.length) {
      this.hits += 1;
    }
  }

  public getHits(): number {
    return this.hits;
  }

  public isSunk(): boolean {
    return this.hits >= this.length;
  }
}
