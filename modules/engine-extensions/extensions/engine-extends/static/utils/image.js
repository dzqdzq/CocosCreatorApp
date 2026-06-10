const getImageData = async (e) => {
  const a = document.createElement("img");
  a.src = e;

  await new Promise((e, t) => {
    a.addEventListener("load", () => {
      e(a);
    });

    a.addEventListener("error", () => {
      t();
    });
  });

  e = document.createElement("canvas");
  e.width = a.width;
  e.height = a.height;
  e = e.getContext("2d");
  e.drawImage(a, 0, 0);
  return e.getImageData(0, 0, a.width, a.height);
};
module.exports = { getImageData };
