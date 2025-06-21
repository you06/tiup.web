export class AsyncMemCache<T> {
    private value?: T;
    private expiredAt?: Date;
    private validDuration: number
    private asyncLoadFn: () => Promise<T>;

    constructor(validDuration: number, asyncLoadFn: () => Promise<T>) {
        this.asyncLoadFn = asyncLoadFn
        this.validDuration = validDuration;
    }

    async getValue(): Promise<T> {
        const curr = new Date()
        if (this.value && this.expiredAt && curr < this.expiredAt) {
            return this.value;
        }
        const value = await this.asyncLoadFn();
        this.value = value;
        this.expiredAt = new Date(Date.now() + this.validDuration)
        return value;
    }
}
