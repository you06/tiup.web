export default class XTermInput {
    private history: string[] = [];
    private index: number = -1;

    public prev(): [boolean, string] {
        if (this.index === -1) {}
        return [false, '']
    }
}
