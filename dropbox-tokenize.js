var Autocompleter = {};
Autocompleter.Base = Class.create({baseInitialize: function(b, c, a) {
        b = $(b);
        this.element = b;
        this.update = $(c);
        this.hasFocus = false;
        this.changed = false;
        this.active = false;
        this.index = 0;
        this.entryCount = 0;
        this.oldElementValue = this.element.value;
        if (this.setOptions) {
            this.setOptions(a)
        } else {
            this.options = a || {}
        }
        this.options.paramName = this.options.paramName || this.element.name;
        this.options.tokens = this.options.tokens || [];
        this.options.frequency = this.options.frequency || 0.4;
        this.options.minChars = this.options.minChars || 1;
        this.options.onShow = this.options.onShow || function(d, e) {
            if (!e.style.position || e.style.position == "absolute") {
                e.style.position = "absolute";
                Position.clone(d, e, {setHeight: false,offsetTop: d.offsetHeight - 1})
            }
            Effect.Appear(e, {duration: 0.15})
        };
        this.options.onHide = this.options.onHide || function(d, e) {
            new Effect.Fade(e, {duration: 0.15})
        };
        if (typeof (this.options.tokens) == "string") {
            this.options.tokens = new Array(this.options.tokens)
        }
        if (!this.options.tokens.include("\n")) {
            this.options.tokens.push("\n")
        }
        this.observer = null;
        this.element.setAttribute("autocomplete", "off");
        Element.hide(this.update);
        Event.observe(this.element, "blur", this.onBlur.bindAsEventListener(this));
        Event.observe(this.element, "keydown", this.onKeyPress.bindAsEventListener(this))
    },show: function() {
        if (Element.getStyle(this.update, "display") == "none") {
            this.options.onShow(this.element, this.update)
        }
        if (!this.iefix && (Prototype.Browser.IE) && (Element.getStyle(this.update, "position") == "absolute")) {
            new Insertion.After(this.update, '<iframe id="' + this.update.id + '_iefix" style="display:none;position:absolute;filter:progid:DXImageTransform.Microsoft.Alpha(opacity=0);" src="javascript:false;" frameborder="0" scrolling="no"></iframe>');
            this.iefix = $(this.update.id + "_iefix")
        }
        if (this.iefix) {
            setTimeout(this.fixIEOverlapping.bind(this), 50)
        }
    },fixIEOverlapping: function() {
        Position.clone(this.update, this.iefix, {setTop: (!this.update.style.height)});
        this.iefix.style.zIndex = 1;
        this.update.style.zIndex = 2;
        Element.show(this.iefix)
    },hide: function() {
        this.stopIndicator();
        if (Element.getStyle(this.update, "display") != "none") {
            this.options.onHide(this.element, this.update)
        }
        if (this.iefix) {
            Element.hide(this.iefix)
        }
    },startIndicator: function() {
        if (this.options.indicator) {
            Element.show(this.options.indicator)
        }
    },stopIndicator: function() {
        if (this.options.indicator) {
            Element.hide(this.options.indicator)
        }
    },onKeyPress: function(a) {
        this.onObserverEvent();
        if (this.active) {
            switch (a.keyCode) {
                case Event.KEY_TAB:
                case Event.KEY_RETURN:
                    this.selectEntry();
                    Event.stop(a);
                case Event.KEY_ESC:
                    this.hide();
                    this.active = false;
                    Event.stop(a);
                    return;
                case Event.KEY_LEFT:
                case Event.KEY_RIGHT:
                    return;
                case Event.KEY_UP:
                    this.markPrevious();
                    this.render();
                    Event.stop(a);
                    return;
                case Event.KEY_DOWN:
                    this.markNext();
                    this.render();
                    Event.stop(a);
                    return
            }
        } else {
            if (a.keyCode == Event.KEY_TAB || a.keyCode == Event.KEY_RETURN || (Prototype.Browser.WebKit > 0 && a.keyCode == 0)) {
                return
            }
        }
        this.changed = true;
        this.hasFocus = true;
        if (this.observer) {
            clearTimeout(this.observer)
        }
        this.observer = setTimeout(this.onObserverEvent.bind(this), this.options.frequency * 1000)
    },activate: function() {
        this.changed = false;
        this.hasFocus = true;
        this.getUpdatedChoices()
    },onHover: function(b) {
        var a = Event.findElement(b, "LI");
        if (this.index != a.autocompleteIndex) {
            this.index = a.autocompleteIndex;
            this.render()
        }
        Event.stop(b)
    },onClick: function(b) {
        var a = Event.findElement(b, "LI");
        this.index = a.autocompleteIndex;
        this.selectEntry();
        this.hide()
    },onBlur: function(a) {
        setTimeout(this.hide.bind(this), 250);
        this.hasFocus = false;
        this.active = false
    },render: function() {
        if (this.entryCount > 0) {
            for (var a = 0; a < this.entryCount; a++) {
                this.index == a ? Element.addClassName(this.getEntry(a), "selected") : Element.removeClassName(this.getEntry(a), "selected")
            }
            if (this.hasFocus) {
                this.show();
                this.active = true
            }
        } else {
            this.active = false;
            this.hide()
        }
    },markPrevious: function() {
        if (this.index > 0) {
            this.index--
        } else {
            this.index = this.entryCount - 1
        }
        this.getEntry(this.index)
    },markNext: function() {
        if (this.index < this.entryCount - 1) {
            this.index++
        } else {
            this.index = 0
        }
        this.getEntry(this.index)
    },getEntry: function(a) {
        return this.update.firstChild.childNodes[a]
    },getCurrentEntry: function() {
        return this.getEntry(this.index)
    },selectEntry: function() {
        this.active = false;
        this.updateElement(this.getCurrentEntry());
        this.index = 0
    },updateElement: function(f) {
        if (this.options.updateElement) {
            this.options.updateElement(f);
            return
        }
        var d = "";
        if (this.options.select) {
            var a = $(f).select("." + this.options.select) || [];
            if (a.length > 0) {
                d = Element.collectTextNodes(a[0], this.options.select)
            }
        } else {
            d = Element.collectTextNodesIgnoreClass(f, "informal")
        }
        var c = this.getTokenBounds();
        if (c[0] != -1) {
            var e = this.element.value.substr(0, c[0]);
            var b = this.element.value.substr(c[0]).match(/^\s+/);
            if (b) {
                e += b[0]
            }
            this.element.value = e + d + this.element.value.substr(c[1])
        } else {
            this.element.value = d
        }
        this.oldElementValue = this.element.value;
        this.element.focus();
        if (this.options.afterUpdateElement) {
            this.options.afterUpdateElement(this.element, f)
        }
    },updateChoices: function(c) {
        if (!this.changed && this.hasFocus) {
            this.update.innerHTML = c;
            Element.cleanWhitespace(this.update);
            Element.cleanWhitespace(this.update.down());
            if (this.update.firstChild && this.update.down().childNodes) {
                this.entryCount = this.update.down().childNodes.length;
                for (var a = 0; a < this.entryCount; a++) {
                    var b = this.getEntry(a);
                    b.autocompleteIndex = a;
                    this.addObservers(b)
                }
                if (this.index >= this.entryCount) {
                    this.index = 0
                }
            } else {
                this.entryCount = 0
            }
            this.stopIndicator();
            if (this.entryCount == 1 && this.options.autoSelect) {
                this.selectEntry();
                this.hide()
            } else {
                this.render()
            }
        }
    },addObservers: function(a) {
        Event.observe(a, "mouseover", this.onHover.bindAsEventListener(this));
        Event.observe(a, "click", this.onClick.bindAsEventListener(this))
    },onObserverEvent: function() {
        this.changed = false;
        this.tokenBounds = null;
        if (this.getToken().length >= this.options.minChars) {
            this.getUpdatedChoices()
        } else {
            this.active = false;
            this.hide()
        }
        this.oldElementValue = this.element.value
    },getToken: function() {
        var a = this.getTokenBounds();
        return this.element.value.substring(a[0], a[1]).strip()
    },getTokenBounds: function() {
        if (null != this.tokenBounds) {
            return this.tokenBounds
        }
        var e = this.element.value;
        if (e.strip().empty()) {
            return [-1, 0]
        }
        var f = arguments.callee.getFirstDifferencePos(e, this.oldElementValue);
        var h = (f == this.oldElementValue.length ? 1 : 0);
        var d = -1, c = e.length;
        var g;
        for (var b = 0, a = this.options.tokens.length; b < a; ++b) {
            g = e.lastIndexOf(this.options.tokens[b], f + h - 1);
            if (g > d) {
                d = g
            }
            g = e.indexOf(this.options.tokens[b], f + h);
            if (-1 != g && g < c) {
                c = g
            }
        }
        return (this.tokenBounds = [d + 1, c])
    }});
Autocompleter.Base.prototype.getTokenBounds.getFirstDifferencePos = function(c, a) {
    var d = Math.min(c.length, a.length);
    for (var b = 0; b < d; ++b) {
        if (c[b] != a[b]) {
            return b
        }
    }
    return d
};
Ajax.Autocompleter = Class.create(Autocompleter.Base, {initialize: function(c, d, b, a) {
        this.baseInitialize(c, d, a);
        this.options.asynchronous = true;
        this.options.onComplete = this.onComplete.bind(this);
        this.options.defaultParams = this.options.parameters || null;
        this.url = b
    },getUpdatedChoices: function() {
        this.startIndicator();
        var a = encodeURIComponent(this.options.paramName) + "=" + encodeURIComponent(this.getToken());
        this.options.parameters = this.options.callback ? this.options.callback(this.element, a) : a;
        if (this.options.defaultParams) {
            this.options.parameters += "&" + this.options.defaultParams
        }
        new Ajax.Request(this.url, this.options)
    },onComplete: function(a) {
        this.updateChoices(a.responseText)
    }});
Autocompleter.Local = Class.create(Autocompleter.Base, {initialize: function(b, d, c, a) {
        this.baseInitialize(b, d, a);
        this.options.array = c
    },getUpdatedChoices: function() {
        this.updateChoices(this.options.selector(this))
    },setOptions: function(a) {
        this.options = Object.extend({choices: 10,partialSearch: true,partialChars: 2,ignoreCase: true,fullSearch: false,selector: function(b) {
                var d = [];
                var c = [];
                var h = b.getToken();
                var g = 0;
                for (var e = 0; e < b.options.array.length && d.length < b.options.choices; e++) {
                    var f = b.options.array[e];
                    var j = b.options.ignoreCase ? f.toLowerCase().indexOf(h.toLowerCase()) : f.indexOf(h);
                    while (j != -1) {
                        if (j == 0 && f.length != h.length) {
                            d.push("<li><strong>" + f.substr(0, h.length) + "</strong>" + f.substr(h.length) + "</li>");
                            break
                        } else {
                            if (h.length >= b.options.partialChars && b.options.partialSearch && j != -1) {
                                if (b.options.fullSearch || /\s/.test(f.substr(j - 1, 1))) {
                                    c.push("<li>" + f.substr(0, j) + "<strong>" + f.substr(j, h.length) + "</strong>" + f.substr(j + h.length) + "</li>");
                                    break
                                }
                            }
                        }
                        j = b.options.ignoreCase ? f.toLowerCase().indexOf(h.toLowerCase(), j + 1) : f.indexOf(h, j + 1)
                    }
                }
                if (c.length) {
                    d = d.concat(c.slice(0, b.options.choices - d.length))
                }
                return "<ul>" + d.join("") + "</ul>"
            }}, a || {})
    }});