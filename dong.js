'use strict';

// http://dongerlist.com/create-donger
var parts = {
    arms: {
        right: ["\u256f", "\uff89", "\u30ce", "\u0a6d", "\u22cc", "\u256d", "\u256e", "\u2283", "\u3064", "\u1557", "\u0b68", "\u2510", "\u2518", "\u0648", "\u028b", "\u0e07", "\u1564", "\u14c4", "\u256e", "\u310f", "\u1564", "\u005f\u002f\u00af", "\u2550\u255d", "\u250c\u2229\u2510", "\u256d\u006f", "\u30ce\u2312\u002e", "\u256e\u002f\u2571\u005c"],
        left: ["\u2570", "\u30fd", "\u0a67", "\u22cb", "\u1559", "\u1555", "\u0b67", "\u250c", "\u2514", "\u0669", "\u1566", "\u3078", "\u0063", "\u4e41", "\u0505", "\u00af\u005c\u005f", "\u255a\u2550", "\u006f\u256e", "\u002f\u2572\u002f\u256d"],
        both: ["\u2229", "\u10da", "\u51f8", "\u301c", "\u256d\u2229\u256e"]
    },
    body: {
        left: ["\u0028", "\u005b", "\u0f3c", "\u0295", "\u3033", "\u0ed2\u0028"],
        right: ["\u0029", "\u005d", "\u0f3d", "\u0294", "\u3035", "\u0029\u096d"],
        both: ["\u007c", "\u205e", "\u0f0d", "\u0f0d", "\u254f", "\u2551", "\u2590", "\u2591", "\u2592"]
    },
    cheeks: ['\u002e', '\u273f', '\u02f5', '\u002c', '\u002a', '\u201d', '\u003d', '\u007e', '\u2217', '\u003a'],
    eyes: ['\u2022\u0301', '\u2022\u0300', '\uffe3', '\u0753', '\u2716', '\uff65', '\u055e', '\ufe52', '\ufe52\ufe23', '\ufe23', '\u2323', '\u0301', '\u2070', '\u275b', '\u00af\u0352', '\u00af', '\u0352', '\u00b4', '\u0060', '\u0f40', '\u0f0e\u0eb6', '\u0e88', '\u004f', '\u0361', '\u25d5', '\u002d', '\u0360\u00b0', '\u00b0\u0360', '\u21c0', '\u21bc', '\u0ca5', '\u262f', '\u035d\u00b0', '\u00b0', '\u0ca0', '\u0ca0', '\u0ca0\u0cc3', '\u0cb0', '\u0cb0\u0cc3', '\u0cb0', '\u25d5', '\u02d9', '\u25d4', '\u0361\u00b0', '\u25a1', '\u2310', '\u2580', '\u30fb', '\u25c9', '\u203e\u0301', '\u002d', '\u2299', '\u25d0', '\u25d6', '\u25d7', '\u25d1', '\u30d8', '\u00ac', '\u2256', '\u033f\u033f', '\u033f', '\uff65\u0e34', '\u0e34', '\u25d4', '\u0298\u0306', '\u0298', '\u2609', '\u003b', '\u0361\u25a0', '\u25a0\u0361', '\u0361\u00b0', '\u00b0\u0361', '\u0361\u0e88', '\u0e88\u0361', '\u0e88', '\u0361\u25d5', '\u25d5\u0361', '\u25d5', '\u00b0', '\u25c9', '\u0361', '\u00ba', '\u0361\u003b', '\u0361\u2609', '\u00b0', '\u035c\u0ca0', '\u0361\u0298', '\u0361\u2019', '\u2022', '\u005e', '\u25d5', '\u2580\u033f', '\u0298\u0361', '\u2013', '\u275b', '\u0078', '\u1d3c', '\uff3e', '\u02d8', '\u06de', '\u25ef', '\u0e51', '\u0361\u1d54', '\u0361\u00b0', '\u00b0', '\u0352', '\u03c3', '\u272a', '\u2665', '\u275b\u0e31', '\u2022\u0300', '\u2022\u0301', '\u2609', '\u0360\u0e88', '\u2565', '\u1d52\u030c', '\u0ca1', '\u0361\u00b0\u0332', '\u1d55', '\u0b3f', '\u0b56', '\u0b35', '\u0bcd', '\u0c66', '\u0ccd', '\u0ca0', '\u0d30', '\u0dd2', '\u14c0', '\u14c2', '\u22a1', '\u2299', '\u229a', '\u2298', '\u2297', '\u262f', '\u00a4'],
    mouth: ['\u005f', '\u0a0a', '\ufe3f', '\u006f', '\u301c', '\u3030', '\u2227', '\u0414', '\u06dd', '\u06a1', '\u0296', '\u035c\u0296', '\u0644\u035c', '\u002d', '\u2038', '\u2302', '\u0644\u035f', '\ufe4f', '\u76ca', '\u203f', '\u006f', '\u0296\u032f', '\u0139\u032f', '\u035c\u029f', '\u0434', '\u15dc', '\u1d25', '\u0644', '\u03c9', '\u25de\u0c6a\u25df', '\u0c6a', '\u2038', '\u0df4', '\ufe4f\u0941', '\u005f\u0296', '\u002d', '\u035c\u0631', '\u06ba', '\u250f\u0644\u035c\u2513', '\u30ee', '\u035c\u0020\u0296', '\u0139\u032f', '\u25bd', '\u2583', '\u0c6a', '\u2092', '\u005f\u0300', '\u03b5', '\u007e\u035c\u0296\u007e', '\u25a1', '\u25e1', '\u0033', '\u005f\u0296', '\u035f\u0296', '\u06a1', '\u25ef', '\u0296\u032b', '\u256d\u0020\u035f\u0296\u256e', '\u256d\u035c\u0296\u256e', '\u035f\u0644\u035c', '\u06dd', '\u007e', '\u035c\u0296', '\u0028\u006f\u006f\u0029', '\u25be'],
    accessories: ['\u252c\u2534\u252c\u2534\u2524', '\u251c\u252c\u2534\u252c\u2534', '\u22b9', '\ufe3b\u0337\u253b\u033f\u2550\u2501\u4e00', '\u2501\u2606\uff9f\u002e\u002a\uff65\uff61\uff9f', '\ufe35\u253b\u2501\u253b', '\u005a\u007a\u007a\u007a\u007a\u007a\u007a', '\u2020', '\u2310\u25a0\u002d\u25a0', '\u2721', '\u002f\u0335\u0347\u033f\u033f\u002f\u2019\u033f\u2019\u033f\u0020\u033f', '\ufe35\u0020\u0e2a\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e47\u0e2a', '\u252c\u2500\u2500\u2500\u252c', '\u0489\u031b\u0f3d\u0328\u0489\u0489\uff89\u0328', '\u0f3c\u0020\u0f3d', '\u252c\u2500\u2500\u252c\u256f\ufeff', '\u033f\u0020\u033f\u0020\u033f\u0020\u033f\u2019\u033f\u2019\u0335\u0437', '\u266b', '\u266a', '\u273f', '\u0028\u0020\u002e\u0020\u0028\u0020\u002e\u0020\u0029', '\u2501\u0020\u5350', '\u5350', '\u00f0', '\u2702', '\u2570\u22c3\u256f', '\u033f\u033f\u0020\u033f\u033f\u0020\u033f\u2019\u033f\u2019\u0335\u0347\u033f\u033f\u0437\u003d', '\u002d\u005d\u2014\u002d', '\ufe35\u0020\u01dd\u029e\u006f\u027e\u0020\u01dd\u026f\u0250\u0073', '\u2523\u2587\u2587\u2587\u2550\u2500\u2500', '\u2501\u2564\u30c7\u2566\ufe3b', '\u251c\u252c', '\u00a4\u003d\u005b\u005d\u003a\u003a\u003a\u003a\u003a\u003e', '\u2312\u002e\u005b\u0332\u0305\u0024\u0332\u0305\u0028\u0332\u0305\u0020\u0361\u00b0\u0020\u035c\u0296\u0020\u0361\u00b0\u0332\u0305\u0029\u0332\u0305\u0024\u0332\u0305\u005d']
};

function sample(array) {
    return array[Math.floor(array.length * Math.random())];
}

var orientations = {
    center: 0,
    left: 1,
    right: 2
};

function arms(orientation) {
    if (orientation === orientations.center) {
        if (Math.random() < 0.5) {
            let arm = sample(parts.arms.both);
            return {left: arm, right: arm};
        } else {
            return {left: sample(parts.arms.left), right: sample(parts.arms.right)};
        }
    } else if (orientation === orientations.left) {
        let arm = sample(parts.arms.left);
        return {left: arm, right: arm};
    } else if (orientation === orientations.right) {
        let arm = sample(parts.arms.right);
        return {left: arm, right: arm};
    }
}

function body() {
    if (Math.random() < 0.5) {
        var i = Math.floor(Math.random() * parts.body.left.length);
        return {left: parts.body.left[i], right: parts.body.right[i]};
    } else {
        var b = sample(parts.body.both);
        return {left: b, right: b};
    }
}

function eyes() {
    return sample(parts.eyes);
}

function cheeks() {
    return Math.random() < 0.1 ? sample(parts.cheeks) : '';
}

function mouth() {
    return sample(parts.mouth);
}

function assemble(dong) {
    if (dong.orientation === orientations.left) {
        // \(-_-o\ ) <-- Sample dong
        return dong.arms.left + dong.body.left + dong.eyes + dong.mouth + dong.eyes + dong.cheeks + dong.arms.right + (Math.random() < 0.1 ? ' ' : '') + dong.body.right;
    } else if (dong.orientation === orientations.right) {
        // ( /o-_-)/
        return dong.body.left + (Math.random() < 0.1 ? ' ' : '') + dong.arms.left + dong.cheeks + dong.eyes + dong.mouth + dong.eyes + dong.body.right + dong.arms.right;
    } else {
        // \(o^_^o)/
        return dong.arms.left + dong.body.left + dong.cheeks + dong.eyes + dong.mouth + dong.eyes + dong.cheeks + dong.body.right + dong.arms.right;
    }
}

module.exports.dankest = function() {
    var orientation = sample([0, 1, 2]);
    var dong = {
        orientation,
        arms: arms(orientation),
        body: body(orientation),
        eyes: eyes(),
        cheeks: cheeks(),
        mouth: mouth()
    };
    return assemble(dong);
};