
var Pallet_Agent = function Pallet_Agent(palletID, frameType, frameColor, screenType, screenColor, keyType, keyColor, status) {
    this.palletID_ = palletID;
    this.frameType_ = frameType;
    this.frameColor_ = frameColor;
    this.screenType_ = screenType;
    this.screenColor_ = screenColor;
    this.keyType_ = keyType;
    this.keyColor_ = keyColor;
    this.status_ = status;
    this.path_ = [];
};

Pallet_Agent.prototype.getPalletID = function () {
    return this.palletID_;
};

Pallet_Agent.prototype.getFrameType = function () {
    return this.frameType_;
};

Pallet_Agent.prototype.getFrameColor = function () {
    return this.frameColor_;
};

Pallet_Agent.prototype.getScreenType = function () {
    return this.screenType_;
};

Pallet_Agent.prototype.getScreenColor = function () {
    return this.screenColor_;
};

Pallet_Agent.prototype.getKeyType = function () {
    return this.keyType_;
};

Pallet_Agent.prototype.getKeyColor = function () {
    return this.keyColor_;
};

Pallet_Agent.prototype.setPath = function (path) {
    this.path_ = path;
};

Pallet_Agent.prototype.getPath = function () {
    return this.path_;
};

module.exports = Pallet_Agent;