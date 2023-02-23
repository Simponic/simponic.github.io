// http://www.russellcottrell.com/fractalsEtc/cx.js

class cx {
  static degrees(d) {
    cx._RD = d ? Math.PI / 180 : 1;
  }
  // Math.PI/180 for degrees, 1 for radians
  // applies to i/o (constructor, get/set arg, and toString etc.)

  constructor(x, y, polar) {
    if (!polar) {
      this.re = x;
      this.im = y;
    } else {
      y *= cx._RD; // may be radians or degrees
      this.re = x * Math.cos(y);
      this.im = x * Math.sin(y);
    }
  }

  get abs() {
    return Math.sqrt(this.re * this.re + this.im * this.im);
  }

  set abs(r) {
    var theta = this._arg;
    this.re = r * Math.cos(theta);
    this.im = r * Math.sin(theta);
  }

  get arg() {
    // returns radians or degrees, non-negative
    return (
      ((Math.atan2(this.im, this.re) + 2 * Math.PI) % (2 * Math.PI)) / cx._RD
    );
  }

  set arg(theta) {
    // may be radians or degrees
    var r = this.abs;
    this.re = r * Math.cos(theta * cx._RD);
    this.im = r * Math.sin(theta * cx._RD);
  }

  get _arg() {
    // internal; returns radians
    return Math.atan2(this.im, this.re);
  }

  static get i() {
    return new cx(0, 1);
  }

  static set i(x) {
    throw new Error("i is read-only");
  }

  toString(polar) {
    if (!polar)
      return (
        this.re.toString() +
        (this.im >= 0 ? " + " : " - ") +
        Math.abs(this.im).toString() +
        "i"
      );
    else return this.abs.toString() + " cis " + this.arg.toString();
  }

  toPrecision(n, polar) {
    if (!polar)
      return (
        this.re.toPrecision(n) +
        (this.im >= 0 ? " + " : " - ") +
        Math.abs(this.im).toPrecision(n) +
        "i"
      );
    else return this.abs.toPrecision(n) + " cis " + this.arg.toPrecision(n);
  }

  toPrecis(n, polar) {
    // trims trailing zeros
    if (!polar)
      return (
        parseFloat(this.re.toPrecision(n)).toString() +
        (this.im >= 0 ? " + " : " - ") +
        parseFloat(Math.abs(this.im).toPrecision(n)).toString() +
        "i"
      );
    else
      return (
        parseFloat(this.abs.toPrecision(n)).toString() +
        " cis " +
        parseFloat(this.arg.toPrecision(n)).toString()
      );
  }

  toFixed(n, polar) {
    if (!polar)
      return (
        this.re.toFixed(n) +
        (this.im >= 0 ? " + " : " - ") +
        Math.abs(this.im).toFixed(n) +
        "i"
      );
    else return this.abs.toFixed(n) + " cis " + this.arg.toFixed(n);
  }

  toExponential(n, polar) {
    if (!polar)
      return (
        this.re.toExponential(n) +
        (this.im >= 0 ? " + " : " - ") +
        Math.abs(this.im).toExponential(n) +
        "i"
      );
    else return this.abs.toExponential(n) + " cis " + this.arg.toExponential(n);
  }

  static getReals(c, d) {
    // when c or d may be simple or complex
    var x, y, u, v;
    if (c instanceof cx) {
      x = c.re;
      y = c.im;
    } else {
      x = c;
      y = 0;
    }
    if (d instanceof cx) {
      u = d.re;
      v = d.im;
    } else {
      u = d;
      v = 0;
    }
    return [x, y, u, v];
  }

  static conj(c) {
    return new cx(c.re, -c.im);
  }

  static neg(c) {
    return new cx(-c.re, -c.im);
  }

  static add(c, d) {
    var a = cx.getReals(c, d);
    var x = a[0];
    var y = a[1];
    var u = a[2];
    var v = a[3];
    return new cx(x + u, y + v);
  }

  static sub(c, d) {
    var a = cx.getReals(c, d);
    var x = a[0];
    var y = a[1];
    var u = a[2];
    var v = a[3];
    return new cx(x - u, y - v);
  }

  static mult(c, d) {
    var a = cx.getReals(c, d);
    var x = a[0];
    var y = a[1];
    var u = a[2];
    var v = a[3];
    return new cx(x * u - y * v, x * v + y * u);
  }

  static div(c, d) {
    var a = cx.getReals(c, d);
    var x = a[0];
    var y = a[1];
    var u = a[2];
    var v = a[3];
    return new cx(
      (x * u + y * v) / (u * u + v * v),
      (y * u - x * v) / (u * u + v * v)
    );
  }

  static pow(c, int) {
    if (Number.isInteger(int) && int >= 0) {
      var r = Math.pow(c.abs, int);
      var theta = int * c._arg;
      return new cx(r * Math.cos(theta), r * Math.sin(theta));
    } else return NaN;
  }

  static root(c, int, k) {
    if (!k) k = 0;
    if (
      Number.isInteger(int) &&
      int >= 2 &&
      Number.isInteger(k) &&
      k >= 0 &&
      k < int
    ) {
      var r = Math.pow(c.abs, 1 / int);
      var theta = (c._arg + 2 * k * Math.PI) / int;
      return new cx(r * Math.cos(theta), r * Math.sin(theta));
    } else return NaN;
  }

  static log(c) {
    return new cx(Math.log(c.abs), c._arg);
  }

  static exp(c) {
    var r = Math.exp(c.re);
    var theta = c.im;
    return new cx(r * Math.cos(theta), r * Math.sin(theta));
  }

  static sin(c) {
    var a = c.re;
    var b = c.im;
    return new cx(Math.sin(a) * Math.cosh(b), Math.cos(a) * Math.sinh(b));
  }

  static cos(c) {
    var a = c.re;
    var b = c.im;
    return new cx(Math.cos(a) * Math.cosh(b), -Math.sin(a) * Math.sinh(b));
  }

  static tan(c) {
    return cx.div(cx.sin(c), cx.cos(c));
  }

  static asin(c, k) {
    if (!k) k = 0;
    var ic = cx.mult(cx.i, c);
    var c2 = cx.pow(c, 2);
    return cx.mult(
      cx.neg(cx.i),
      cx.log(cx.add(ic, cx.root(cx.sub(1, c2), 2, k)))
    );
  }

  static acos(c, k) {
    if (!k) k = 0;
    var c2 = cx.pow(c, 2);
    return cx.mult(
      cx.neg(cx.i),
      cx.log(cx.add(c, cx.mult(cx.i, cx.root(cx.sub(1, c2), 2, k))))
    );
  }

  static atan(c) {
    return cx.mult(
      cx.div(cx.i, 2),
      cx.log(cx.div(cx.add(cx.i, c), cx.sub(cx.i, c)))
    );
  }

  static sinh(c) {
    var a = c.re;
    var b = c.im;
    return new cx(Math.sinh(a) * Math.cos(b), Math.cosh(a) * Math.sin(b));
  }

  static cosh(c) {
    var a = c.re;
    var b = c.im;
    return new cx(Math.cosh(a) * Math.cos(b), Math.sinh(a) * Math.sin(b));
  }

  static tanh(c) {
    return cx.div(cx.sinh(c), cx.cosh(c));
  }

  static asinh(c, k) {
    if (!k) k = 0;
    var c2 = cx.pow(c, 2);
    return cx.log(cx.add(c, cx.root(cx.add(c2, 1), 2, k)));
  }

  static acosh(c, k) {
    if (!k) k = 0;
    var c2 = cx.pow(c, 2);
    return cx.log(cx.add(c, cx.root(cx.sub(c2, 1), 2, k)));
  }

  static atanh(c) {
    return cx.mult(cx.div(1, 2), cx.log(cx.div(cx.add(1, c), cx.sub(1, c))));
  }

  static copy(c) {
    return new cx(c.re, c.im);
  }

  static eq(c, d, epsilon) {
    if (!epsilon) {
      if (c.re == d.re && c.im == d.im) return true;
    } else {
      if (Math.abs(c.re - d.re) < epsilon && Math.abs(c.im - d.im) < epsilon)
        return true;
    }
    return false;
  }
}

cx.degrees(true); // need to call this
