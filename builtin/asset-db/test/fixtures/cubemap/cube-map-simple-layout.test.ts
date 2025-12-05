// /**
//  * Generates cube map image in different simple layout.
//  */

// import Jimp from 'jimp';
// import { simpleLayoutTable } from './cube-map-simple-layout';

// const faceSize = 512;

// const faceColorTable: Record<string, [number, string]> = {
//     right: [0xFF0000FF, '+X'],
//     left:  [0x880000FF, '-X'],
//     top:   [0x00FF00FF, '+Y'],
//     bottom:[0x008800FF, '-Y'],
//     front: [0x0000FFFF, '+Z'],
//     back:  [0x000088FF, '-Z'],
// };

// (async () => {
//     const font = await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK);
//     for (const [[matchedWidth, matchedHeight], layoutCoords] of simpleLayoutTable) {
//         const actualWidth = faceSize * matchedWidth;
//         const actualHeight = faceSize * matchedHeight;
//         const image = await Jimp.create(actualWidth, actualHeight);
//         for (const faceName of Object.getOwnPropertyNames(layoutCoords) as (keyof typeof layoutCoords)[]) {
//             const [xStart, yStart] = layoutCoords[faceName as keyof typeof layoutCoords];
//             const [faceColor, faceString] = faceColorTable[faceName];
//             for (let x = xStart * faceSize; x < (xStart + 1) * faceSize; ++x) {
//                 for (let y = yStart * faceSize; y < (yStart + 1) * faceSize; ++y) {
//                     image.setPixelColor(faceColor, x, y);
//                 }
//             }
//             const textWidth = Jimp.measureText(font, faceString);
//             const textHeight = Jimp.measureText(font, faceString);
//             const textXStart = xStart * faceSize + (faceSize - textWidth) / 2;
//             const textYStart = yStart * faceSize + (faceSize - textHeight) / 2;
//             await image.print(font, textXStart, textYStart, faceString);
//         }
//         await image.writeAsync(`${matchedWidth}x${matchedHeight}.png`);
//     }
// })();

test('cubemap-simple-layout', () => {
    
});
