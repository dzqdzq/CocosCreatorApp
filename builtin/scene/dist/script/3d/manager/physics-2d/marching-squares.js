var MarchingSquares = {
  NONE: 0,
  UP: 1,
  LEFT: 2,
  DOWN: 3,
  RIGHT: 4,
  getBlobOutlinePoints(a, r, e, n) {
    MarchingSquares.data = a;
    MarchingSquares.width = r;
    MarchingSquares.height = e;
    MarchingSquares.loop = n;
    a = MarchingSquares.getFirstNonTransparentPixelTopDown();
    r = MarchingSquares.walkPerimeter(a.x, a.y);
    MarchingSquares.width = null;
    MarchingSquares.height = null;
    MarchingSquares.data = null;
    MarchingSquares.loop = null;
    return r;
  },
  getFirstNonTransparentPixelTopDown() {
    for (
      var a,
        r = MarchingSquares.data,
        e = MarchingSquares.width,
        n = MarchingSquares.height,
        s = 0,
        i = 0;
      i < n;
      i++
    ) {
      for (a = 0; a < e; a++, s += 4) {
        if (r[s + 3] > 0) {
          return { x: a, y: i };
        }
      }
    }
    return null;
  },
  walkPerimeter(a, r) {
    var e = (a =
      (a = a < 0 ? 0 : a) > MarchingSquares.width ? MarchingSquares.width : a);

    var n = (r =
      (r = r < 0 ? 0 : r) > MarchingSquares.height
        ? MarchingSquares.height
        : r);

    var s = [cc.v2(e, n)];
    do {
      MarchingSquares.step(e, n, MarchingSquares.data);

      switch (MarchingSquares.nextStep) {
        case MarchingSquares.UP: {
          n--;
          break;
        }
        case MarchingSquares.LEFT: {
          e--;
          break;
        }
        case MarchingSquares.DOWN: {
          n++;
          break;
        }
        case MarchingSquares.RIGHT: {
          e++;
        }
      }
    } while (
      (e >= 0 &&
        e <= MarchingSquares.width &&
        n >= 0 &&
        n <= MarchingSquares.height &&
        s.push(cc.v2(e, n)),
      e !== a || n !== r)
    );

    if (MarchingSquares.loop) {
      s.push(cc.v2(e, n));
    }

    return s;
  },
  step(a, r, e) {
    var MarchingSquares_width = MarchingSquares.width;
    var s = 4 * MarchingSquares_width;
    var i = (r - 1) * s + 4 * (a - 1);
    var c = a > 0;
    var a = a < MarchingSquares_width;
    var MarchingSquares_width = r < MarchingSquares.height;
    var r = r > 0;
    MarchingSquares.upLeft = r && c && e[3 + i] > 0;
    MarchingSquares.upRight = r && a && e[7 + i] > 0;
    MarchingSquares.downLeft = MarchingSquares_width && c && e[i + s + 3] > 0;
    MarchingSquares.downRight = MarchingSquares_width && a && e[i + s + 7] > 0;
    MarchingSquares.previousStep = MarchingSquares.nextStep;
    MarchingSquares.state = 0;

    if (MarchingSquares.upLeft) {
      MarchingSquares.state |= 1;
    }

    if (MarchingSquares.upRight) {
      MarchingSquares.state |= 2;
    }

    if (MarchingSquares.downLeft) {
      MarchingSquares.state |= 4;
    }

    if (MarchingSquares.downRight) {
      MarchingSquares.state |= 8;
    }

    switch (MarchingSquares.state) {
      case 1: {
        MarchingSquares.nextStep = MarchingSquares.UP;
        break;
      }
      case 2:
      case 3: {
        MarchingSquares.nextStep = MarchingSquares.RIGHT;
        break;
      }
      case 4: {
        MarchingSquares.nextStep = MarchingSquares.LEFT;
        break;
      }
      case 5: {
        MarchingSquares.nextStep = MarchingSquares.UP;
        break;
      }
      case 6: {
        if (MarchingSquares.previousStep == MarchingSquares.UP) {
          MarchingSquares.nextStep = MarchingSquares.LEFT;
        } else {
          MarchingSquares.nextStep = MarchingSquares.RIGHT;
        }

        break;
      }
      case 7: {
        MarchingSquares.nextStep = MarchingSquares.RIGHT;
        break;
      }
      case 8: {
        MarchingSquares.nextStep = MarchingSquares.DOWN;
        break;
      }
      case 9: {
        if (MarchingSquares.previousStep == MarchingSquares.RIGHT) {
          MarchingSquares.nextStep = MarchingSquares.UP;
        } else {
          MarchingSquares.nextStep = MarchingSquares.DOWN;
        }

        break;
      }
      case 10:
      case 11: {
        MarchingSquares.nextStep = MarchingSquares.DOWN;
        break;
      }
      case 12: {
        MarchingSquares.nextStep = MarchingSquares.LEFT;
        break;
      }
      case 13: {
        MarchingSquares.nextStep = MarchingSquares.UP;
        break;
      }
      case 14: {
        MarchingSquares.nextStep = MarchingSquares.LEFT;
        break;
      }
      default: {
        MarchingSquares.nextStep = MarchingSquares.NONE;
      }
    }
  },
};
module.exports = MarchingSquares;
