﻿class Arrow {
    constructor(balloon, p) {
        [this.x0, this.y0] = p;
        [this.x1, this.y1] = p;
        this.headBalloon = null;
        this.tailBalloon = balloon;
        balloon.childArrows.push(this);
        this.arrow = Space.s.line();
        //this.arrow = Space.s.path(this.getPathString());
        this.updateArrow();
    }

    setVisibility(value) {
        this.arrow.attr({ visibility: value });
    }

    hide() {
        this.setVisibility('hidden');
    }

    show() {
        this.setVisibility('visible');
    }

    getStartAndEnd() {
        var [x0, y0, x1, y1] = [this.x0, this.y0, this.x1, this.y1];
        var [dx, dy] = [x1 - x0, y1 - y0];
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d > 200) {
            var x = function (t) { return x0 + (x1 - x0) * t; }
            var y = function (t) { return y0 + (y1 - y0) * t; }

            var L = 150;
            var [t0, t1] = [L / d, 1 - (L + 70) / d];
            [x0, y0, x1, y1] = [x(t0), y(t0), x(t1), y(t1)];
        }
        return [x0, y0, x1, y1];
    }

    getPathString() {
        const [x0, y0, x1, y1] = this.getStartAndEnd();
        return `M ${x0} ${y0} L ${x1} ${y1}`;
    }

    updateArrow() {
        var [x1, y1, x2, y2] = this.getStartAndEnd();
        this.arrow.attr({
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
            class: 'arrow',
            stroke: 'black',
            strokeWidth: 8,
            opacity: 0.8
        });
        this.arrow.node.setAttribute('marker-end', 'url(#arrowhead)');
        //console.log(this.arrow.node.attributes);
        //this.arrow.attr({ d: this.getPathString() });
    }

    moveHead(x, y) {
        [this.x1, this.y1] = [x, y];
        this.updateArrow();
    }

    moveTail(x, y) {
        [this.x0, this.y0] = [x, y];
        this.updateArrow();
    }

    positionToParent() {
        if (this.tailBalloon === null) return;
        this.tailBalloon.centerTail(this);
    }

    positionToChildren() {
        if (this.headBalloon === null) return;
        this.headBalloon.centerHead(this);
    }

    remove() {
        this.arrow.remove();
    }
}