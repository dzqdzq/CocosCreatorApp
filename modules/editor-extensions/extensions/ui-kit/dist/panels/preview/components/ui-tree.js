Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.template = undefined;
exports.data = data;
exports.mounted = mounted;

const { readFileSync } = require("fs");

const { join } = require("path");

function data() {
  return {};
}
function mounted() {
  const s = this;

  var t = {
    detail: { value: "test", checked: false },
    children: [
      {
        detail: { value: "test-2", checked: false },
        children: [
          {
            detail: { value: "test-3", checked: false },
            showArrow: false,
            children: [],
          },
        ],
      },
    ],
  };

  var r = [];
  for (let e = 0; e < 1000 /* 1e3 */; e++) {
    r.push(JSON.parse(JSON.stringify(t)));
  }
  s.$refs.example.setTemplate("left", "<ui-checkbox></ui-checkbox>");

  s.$refs.example.setTemplateInit("left", (t) => {
    t.$checkbox = t.querySelector("ui-checkbox");

    t.$checkbox.addEventListener("confirm", (e) => {
      t.data.detail.checkbox = !t.data.detail.checkbox;
      s.$refs.example.render(true);
    });
  });

  s.$refs.example.setRender("left", (e, t) => {
    e.$checkbox.value = t.detail.checkbox;
  });

  s.$refs.example.setTemplate(
    "text",
    '<span class="name"></span><span class="link"></span>'
  );

  s.$refs.example.setTemplateInit("text", (e) => {
    e.$name = e.querySelector(".name");
    e.$link = e.querySelector(".link");
  });

  s.$refs.example.setRender("text", (e, t) => {
    e.$name.innerHTML = t.detail.value;
    e.$link.innerHTML = `link(${t.index})`;
  });

  s.$refs.example.setTemplate("right", '<ui-icon value="reset"></ui-icon>');

  s.$refs.example.setTemplateInit("right", (t) => {
    t.$refresh = t.querySelector("ui-icon");

    t.$refresh.addEventListener("click", (e) => {
      console.log(t.data);
    });
  });

  s.$refs.example.tree = r;

  s.$refs.example.addEventListener("keydown", (e) => {
    var t;
    var r = s.$refs.example;

    if (e.code === "ArrowUp") {
      t = r.selectItems[r.selectItems.length - 1];
      t = Math.max(t.index - 1, 0);
      e.shiftKey || r.clear();
      r.select(r.list[t]);
      r.render();
    } else if (e.code === "ArrowDown") {
      t = r.selectItems[r.selectItems.length - 1];
      t = Math.min(t.index + 1, r.list.length - 1);
      e.shiftKey || r.clear();
      r.select(r.list[t]);
      r.render();
    }
  });

  s.$refs.example.setTemplateInit("item", (t) => {
    const r = s.$refs.example;
    t.addEventListener("click", (e) => {
      if (!e.ctrlKey && !e.metaKey) {
        r.clear();
      }

      r.select(t.data);
      r.render();
    });
  });

  s.$refs.example.setRender("item", (e, t) => {
    if (t.detail.disabled) {
      e.setAttribute("disabled", "");
    } else {
      e.removeAttribute("disabled");
    }
  });

  s.$refs.example.setItemRender;

  s.$refs.example.css = `
.item[disabled] {
    opacity: 0.4;
}

.text > .link {
    margin-left: 10px;
    cursor: pointer;
    color: yellow;
}

.right > ui-icon {
    cursor: pointer;
    color: green;
}
    `;
}

exports.template = readFileSync(
  join(__dirname, "../../../../static/template/components/ui-tree.html"),
  "utf8"
);

exports.methods = {};
