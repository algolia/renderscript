export class TimeBudget {
  max: number;
  consumed: number = 0;
  lastConsumption: number = Date.now();

  constructor(max: number) {
    this.max = max;
  }

  /**
   * Consume budget.
   *
   * @returns Number - What was consumed compared to prev call.
   */
  consume(): number {
    const consumed = Date.now() - this.lastConsumption;
    this.consumed += consumed;
    this.lastConsumption = Date.now();
    return consumed;
  }

  get(): number {
    // Not 0, because 0 === unlimited
    return Math.max(1, this.max - this.consumed);
  }

  min(min: number): number {
    return Math.max(min, this.get());
  }

  minmax(min: number, max: number): number {
    return Math.max(min, Math.min(max, this.get()));
  }
}
