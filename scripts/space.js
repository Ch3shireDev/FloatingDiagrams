﻿class Point {
    constructor() {
        this.reset();
    }

    getXY() {
        return [this.x, this.y];
    }

    getRect() {
        return [this.x, this.y, this.w, this.h];
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.w = 3200;
        this.h = 2400;
    }

    update(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
}

var Space = {
    currentElement: null,
    handle: null,
    mouseDown: false,
    draggingBalloon: false,
    draggingHandle: false,
    draggingSpace: false,
    autoText: true,
    moveChildren: true,
    isVisible: true,
    useViewBox: true,
    s: Snap('#body'),
    svg: document.querySelector('svg'),
    xy: [0, 0],
    dxy: [0, 0],
    mousePos: [0, 0],
    point: new Point(),

    moveSpace(dx, dy) {
        var [x, y, w, h] = this.viewBox();
        this.hide();
        dx *= 0.5;
        dy *= 0.5;
        this.viewBox(x - dx, y - dy, w, h);
    },

    zoom(value) {
        if (this.useViewBox) {
            this.hide();
            var [x, y, w, h] = this.viewBox();
            var alpha = w / h;
            x -= value * alpha / 2;
            y -= value / 2;
            w += value * alpha;
            h += value;
            this.viewBox(x, y, w, h);
        }
        else {
            var [x, y, w, h] = this.point.getRect();
            var alpha = w / h;
            x -= value * alpha / 2;
            y -= value / 2;
            w += value * alpha;
            h += value;
            this.point.update(x, y, w, h);
        }
    },

    toInternal(x, y) {
        var [x0, y0] = [Space.point.x, Space.point.y];
        var ctm = this.svg.getScreenCTM();
        var w = $('#body').width();
        var h = $('#body').height();
        var [a, d, e, f] = [ctm.a, ctm.d, ctm.e, ctm.f];
        [x, y] = [(x - e) / a, (y - f) / d];
        return [x, y];
    },

    toScreen(x, y) {
        var [x0, y0] = [Space.point.x, Space.point.y];
        var ctm = this.svg.getScreenCTM();
        var w = $('#body').width();
        var h = $('#body').height();
        var [a, d, e, f] = [ctm.a, ctm.d, ctm.e, ctm.f];
        [x, y] = [x * a + e, y * d + f];
        return [x, y];
    },

    leave(event) {
        Space.mouseDown = false;
    },

    getElement(event) {
        var x = event.clientX,
            y = event.clientY,
            e = document.elementFromPoint(x, y);
        [x, y] = Space.toInternal(x, y);
        return [x, y, e];
    },

    grabElement(event) {
        Space.mouseDown = true;
        var [x, y, element] = Space.getElement(event);
        this.xy = Space.toInternal(event.clientX, event.clientY);
        this.draggingBalloon = false;
        this.draggingHandle = false;
        this.draggingSpace = false;

        if (element == null) return;

        if (element.id === 'tarea') {
            Space.mouseDown = false;
        }
        else {
            closeCurrentTextarea();

            if (element.id === 'body') {
                Space.draggingSpace = true;
            }

            if (element.id === 'handle') {
                this.draggingHandle = true;
                Space.handle.grab();
                return;
            }

            Space.currentElement = Balloons.findFromElement(element);

            if (Space.currentElement != null) {
                Space.draggingBalloon = true;
                Space.currentElement.grab();
            }
        }
    },

    moveElement(event) {
        if (event === null) return;
        if (typeof event == 'undefined') return;
        var [x1, y1] = Space.toInternal(event.clientX, event.clientY);
        var [x0, y0] = this.xy;
        Space.mousePos = [event.clientX, event.clientY];
        var [dx, dy] = [x1 - x0, y1 - y0];
        this.xy = [x1, y1];
        if (typeof Space.isTesting === 'undefined' && event.buttons !== 1) return;
        if (Space.mouseDown === false) return;
        if (Space.draggingBalloon) {
            if (Space.currentElement == null) return;
            var [x, y] = Space.currentElement.getXY();
            Space.currentElement.move(x + dx, y + dy);
        }
        else if (Space.draggingHandle) {
            var [x, y] = Space.handle.getXY();
            Space.handle.move(x + dx, y + dy);
        }
        else if (Space.draggingSpace) {
            if (this.useViewBox) {
                this.moveSpace(dx, dy);
            }
            else {
                this.point.x += dx;
                this.point.y += dy;
                Balloons.refresh();
            }
        }
    },

    releaseElement(event) {
        Space.mouseDown = false;
        var [x, y, e] = this.getElement(event);
        if (this.draggingBalloon) {
            Space.dxy = [0, 0];
            Balloons.drop();
        }
        else if (this.draggingHandle) {
            Space.handle.drop(x, y, event);
        }
        else if (this.draggingSpace) {
            Balloons.drop();
        }
        this.draggingBalloon = false;
        this.draggingHandle = false;
        this.draggingSpace = false;
    },

    createElement(event) {
        var [x, y, element] = Space.getElement(event);
        const tag = element.tagName.toLowerCase();
        if (tag === 'svg') {
            Balloons.addBalloon(x, y);
        }
        else {
            const b = Balloons.findFromElement(element);
            if (b != null) {
                b.openContent();
                $('#tarea').onclick = () => { };
            }
        }
    },

    showHandle() {
        if (Balloons.getLast() === null) return;
        if (Space.handle === null) {
            Space.handle = new Handle();
        }
        this.handle.showHandle();
    },

    viewBox(x, y, w, h) {
        if (x === undefined) {
            var vb = this.s.attr('viewBox');
            return [vb.x, vb.y, vb.w, vb.h];
        }
        else if (h !== undefined) {
            this.s.attr({ viewBox: `${x},${y},${w},${h}` });
        }
    },

    getXY() {
        const [x, y, ,] = this.viewBox();
        return [x, y];
    },

    hide() {
        var tab = $('#body').children();
        var n = tab.length;
        for (var i = 0; i < n; i++) {
            if ($(tab[i]).attr('class') !== 'arrow') continue;
            $(tab[i]).css({ display: 'none' });
        }
        this.isVisible = false;
    },

    show() {
        var tab = $('#body').children();
        var n = tab.length;
        for (var i = 0; i < n; i++) {
            $(tab[i]).css({ display: 'initial' });
        }
        this.isVisible = true;
    },

    clear() {
        this.currentElement = null;
        this.handle = null;
        this.draggingBalloon = false;
        this.draggingHandle = false;
        this.draggingSpace = false;
        this.moveChildren = true;
        Balloons.clear();
        this.svg.innerHTML = '';
        this.point.reset();
        var [x, y, w, h] = this.point.getRect();
        this.s.attr({ viewBox: `${x},${y},${w},${h}` });
        this.svg.innerHTML += '<marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7"/></marker>';
    }
}

Space.clear();
Space.useViewBox = false;