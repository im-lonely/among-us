export default class Player {
    private _id: string;
    private _color: string;

    constructor(id: string, color: string) {
        this._id = id;
        this._color = color;
    }

    public get color() {
        return this._color;
    }

    public get id() {
        return this._id;
    }
}
