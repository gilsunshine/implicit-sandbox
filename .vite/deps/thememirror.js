import {
  EditorView,
  HighlightStyle,
  syntaxHighlighting,
  tags
} from "./chunk-3QKNMDS5.js";
import "./chunk-BPUUWGGA.js";
import "./chunk-5FUTL2UF.js";

// node_modules/thememirror/dist/create-theme.js
var createTheme = ({ variant, settings, styles }) => {
  const theme = EditorView.theme({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "&": {
      backgroundColor: settings.background,
      color: settings.foreground
    },
    ".cm-content": {
      caretColor: settings.caret
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: settings.caret
    },
    "&.cm-focused .cm-selectionBackgroundm .cm-selectionBackground, .cm-content ::selection": {
      backgroundColor: settings.selection
    },
    ".cm-activeLine": {
      backgroundColor: settings.lineHighlight
    },
    ".cm-gutters": {
      backgroundColor: settings.gutterBackground,
      color: settings.gutterForeground
    },
    ".cm-activeLineGutter": {
      backgroundColor: settings.lineHighlight
    }
  }, {
    dark: variant === "dark"
  });
  const highlightStyle = HighlightStyle.define(styles);
  const extension = [theme, syntaxHighlighting(highlightStyle)];
  return extension;
};
var create_theme_default = createTheme;

// node_modules/thememirror/dist/themes/amy.js
var amy = create_theme_default({
  variant: "dark",
  settings: {
    background: "#200020",
    foreground: "#D0D0FF",
    caret: "#7070FF",
    selection: "#80000080",
    gutterBackground: "#200020",
    gutterForeground: "#C080C0",
    lineHighlight: "#80000040"
  },
  styles: [
    {
      tag: tags.comment,
      color: "#404080"
    },
    {
      tag: [tags.string, tags.regexp],
      color: "#999999"
    },
    {
      tag: tags.number,
      color: "#7090B0"
    },
    {
      tag: [tags.bool, tags.null],
      color: "#8080A0"
    },
    {
      tag: [tags.punctuation, tags.derefOperator],
      color: "#805080"
    },
    {
      tag: tags.keyword,
      color: "#60B0FF"
    },
    {
      tag: tags.definitionKeyword,
      color: "#B0FFF0"
    },
    {
      tag: tags.moduleKeyword,
      color: "#60B0FF"
    },
    {
      tag: tags.operator,
      color: "#A0A0FF"
    },
    {
      tag: [tags.variableName, tags.self],
      color: "#008080"
    },
    {
      tag: tags.operatorKeyword,
      color: "#A0A0FF"
    },
    {
      tag: tags.controlKeyword,
      color: "#80A0FF"
    },
    {
      tag: tags.className,
      color: "#70E080"
    },
    {
      tag: [tags.function(tags.propertyName), tags.propertyName],
      color: "#50A0A0"
    },
    {
      tag: tags.tagName,
      color: "#009090"
    },
    {
      tag: tags.modifier,
      color: "#B0FFF0"
    },
    {
      tag: [tags.squareBracket, tags.attributeName],
      color: "#D0D0FF"
    }
  ]
});

// node_modules/thememirror/dist/themes/ayu-light.js
var ayuLight = create_theme_default({
  variant: "light",
  settings: {
    background: "#fcfcfc",
    foreground: "#5c6166",
    caret: "#ffaa33",
    selection: "#036dd626",
    gutterBackground: "#fcfcfc",
    gutterForeground: "#8a919966",
    lineHighlight: "#8a91991a"
  },
  styles: [
    {
      tag: tags.comment,
      color: "#787b8099"
    },
    {
      tag: tags.string,
      color: "#86b300"
    },
    {
      tag: tags.regexp,
      color: "#4cbf99"
    },
    {
      tag: [tags.number, tags.bool, tags.null],
      color: "#ffaa33"
    },
    {
      tag: tags.variableName,
      color: "#5c6166"
    },
    {
      tag: [tags.definitionKeyword, tags.modifier],
      color: "#fa8d3e"
    },
    {
      tag: [tags.keyword, tags.special(tags.brace)],
      color: "#fa8d3e"
    },
    {
      tag: tags.operator,
      color: "#ed9366"
    },
    {
      tag: tags.separator,
      color: "#5c6166b3"
    },
    {
      tag: tags.punctuation,
      color: "#5c6166"
    },
    {
      tag: [tags.definition(tags.propertyName), tags.function(tags.variableName)],
      color: "#f2ae49"
    },
    {
      tag: [tags.className, tags.definition(tags.typeName)],
      color: "#22a4e6"
    },
    {
      tag: [tags.tagName, tags.typeName, tags.self, tags.labelName],
      color: "#55b4d4"
    },
    {
      tag: tags.angleBracket,
      color: "#55b4d480"
    },
    {
      tag: tags.attributeName,
      color: "#f2ae49"
    }
  ]
});

// node_modules/thememirror/dist/themes/barf.js
var barf = create_theme_default({
  variant: "dark",
  settings: {
    background: "#15191EFA",
    foreground: "#EEF2F7",
    caret: "#C4C4C4",
    selection: "#90B2D557",
    gutterBackground: "#15191EFA",
    gutterForeground: "#aaaaaa95",
    lineHighlight: "#57575712"
  },
  styles: [
    {
      tag: tags.comment,
      color: "#6E6E6E"
    },
    {
      tag: [tags.string, tags.regexp, tags.special(tags.brace)],
      color: "#5C81B3"
    },
    {
      tag: tags.number,
      color: "#C1E1B8"
    },
    {
      tag: tags.bool,
      color: "#53667D"
    },
    {
      tag: [tags.definitionKeyword, tags.modifier, tags.function(tags.propertyName)],
      color: "#A3D295",
      fontWeight: "bold"
    },
    {
      tag: [tags.keyword, tags.moduleKeyword, tags.operatorKeyword, tags.operator],
      color: "#697A8E",
      fontWeight: "bold"
    },
    {
      tag: [tags.variableName, tags.attributeName],
      color: "#708E67"
    },
    {
      tag: [
        tags.function(tags.variableName),
        tags.definition(tags.propertyName),
        tags.derefOperator
      ],
      color: "#fff"
    },
    {
      tag: tags.tagName,
      color: "#A3D295"
    }
  ]
});

// node_modules/thememirror/dist/themes/bespin.js
var bespin = create_theme_default({
  variant: "dark",
  settings: {
    background: "#2e241d",
    foreground: "#BAAE9E",
    caret: "#A7A7A7",
    selection: "#DDF0FF33",
    gutterBackground: "#28211C",
    gutterForeground: "#BAAE9E90",
    lineHighlight: "#FFFFFF08"
  },
  styles: [
    {
      tag: tags.comment,
      color: "#666666"
    },
    {
      tag: [tags.string, tags.special(tags.brace)],
      color: "#54BE0D"
    },
    {
      tag: tags.regexp,
      color: "#E9C062"
    },
    {
      tag: tags.number,
      color: "#CF6A4C"
    },
    {
      tag: [tags.keyword, tags.operator],
      color: "#5EA6EA"
    },
    {
      tag: tags.variableName,
      color: "#7587A6"
    },
    {
      tag: [tags.definitionKeyword, tags.modifier],
      color: "#F9EE98"
    },
    {
      tag: [tags.propertyName, tags.function(tags.variableName)],
      color: "#937121"
    },
    {
      tag: [tags.typeName, tags.angleBracket, tags.tagName],
      color: "#9B859D"
    }
  ]
});

// node_modules/thememirror/dist/themes/birds-of-paradise.js
var birdsOfParadise = create_theme_default({
  variant: "dark",
  settings: {
    background: "#3b2627",
    foreground: "#E6E1C4",
    caret: "#E6E1C4",
    selection: "#16120E",
    gutterBackground: "#3b2627",
    gutterForeground: "#E6E1C490",
    lineHighlight: "#1F1611"
  },
  styles: [
    {
      tag: tags.comment,
      color: "#6B4E32"
    },
    {
      tag: [tags.keyword, tags.operator, tags.derefOperator],
      color: "#EF5D32"
    },
    {
      tag: tags.className,
      color: "#EFAC32",
      fontWeight: "bold"
    },
    {
      tag: [
        tags.typeName,
        tags.propertyName,
        tags.function(tags.variableName),
        tags.definition(tags.variableName)
      ],
      color: "#EFAC32"
    },
    {
      tag: tags.definition(tags.typeName),
      color: "#EFAC32",
      fontWeight: "bold"
    },
    {
      tag: tags.labelName,
      color: "#EFAC32",
      fontWeight: "bold"
    },
    {
      tag: [tags.number, tags.bool],
      color: "#6C99BB"
    },
    {
      tag: [tags.variableName, tags.self],
      color: "#7DAF9C"
    },
    {
      tag: [tags.string, tags.special(tags.brace), tags.regexp],
      color: "#D9D762"
    },
    {
      tag: [tags.angleBracket, tags.tagName, tags.attributeName],
      color: "#EFCB43"
    }
  ]
});

// node_modules/thememirror/dist/themes/boys-and-girls.js
var boysAndGirls = create_theme_default({
  variant: "dark",
  settings: {
    background: "#000205",
    foreground: "#FFFFFF",
    caret: "#E60065",
    selection: "#E60C6559",
    gutterBackground: "#000205",
    gutterForeground: "#ffffff90",
    lineHighlight: "#4DD7FC1A"
  },
  styles: [
    {
      tag: tags.comment,
      color: "#404040"
    },
    {
      tag: [tags.string, tags.special(tags.brace), tags.regexp],
      color: "#00D8FF"
    },
    {
      tag: tags.number,
      color: "#E62286"
    },
    {
      tag: [tags.variableName, tags.attributeName, tags.self],
      color: "#E62286",
      fontWeight: "bold"
    },
    {
      tag: tags.function(tags.variableName),
      color: "#fff",
      fontWeight: "bold"
    }
  ]
});

// node_modules/thememirror/dist/themes/clouds.js
var clouds = create_theme_default({
  variant: "light",
  settings: {
    background: "#fff",
    foreground: "#000",
    caret: "#000",
    selection: "#BDD5FC",
    gutterBackground: "#fff",
    gutterForeground: "#00000070",
    lineHighlight: "#FFFBD1"
  },
  styles: [
    {
      tag: tags.comment,
      color: "#BCC8BA"
    },
    {
      tag: [tags.string, tags.special(tags.brace), tags.regexp],
      color: "#5D90CD"
    },
    {
      tag: [tags.number, tags.bool, tags.null],
      color: "#46A609"
    },
    {
      tag: tags.keyword,
      color: "#AF956F"
    },
    {
      tag: [tags.definitionKeyword, tags.modifier],
      color: "#C52727"
    },
    {
      tag: [tags.angleBracket, tags.tagName, tags.attributeName],
      color: "#606060"
    },
    {
      tag: tags.self,
      color: "#000"
    }
  ]
});

// node_modules/thememirror/dist/themes/cobalt.js
var cobalt = create_theme_default({
  variant: "dark",
  settings: {
    background: "#00254b",
    foreground: "#FFFFFF",
    caret: "#FFFFFF",
    selection: "#B36539BF",
    gutterBackground: "#00254b",
    gutterForeground: "#FFFFFF70",
    lineHighlight: "#00000059"
  },
  styles: [
    {
      tag: tags.comment,
      color: "#0088FF"
    },
    {
      tag: tags.string,
      color: "#3AD900"
    },
    {
      tag: tags.regexp,
      color: "#80FFC2"
    },
    {
      tag: [tags.number, tags.bool, tags.null],
      color: "#FF628C"
    },
    {
      tag: [tags.definitionKeyword, tags.modifier],
      color: "#FFEE80"
    },
    {
      tag: tags.variableName,
      color: "#CCCCCC"
    },
    {
      tag: tags.self,
      color: "#FF80E1"
    },
    {
      tag: [
        tags.className,
        tags.definition(tags.propertyName),
        tags.function(tags.variableName),
        tags.definition(tags.typeName),
        tags.labelName
      ],
      color: "#FFDD00"
    },
    {
      tag: [tags.keyword, tags.operator],
      color: "#FF9D00"
    },
    {
      tag: [tags.propertyName, tags.typeName],
      color: "#80FFBB"
    },
    {
      tag: tags.special(tags.brace),
      color: "#EDEF7D"
    },
    {
      tag: tags.attributeName,
      color: "#9EFFFF"
    },
    {
      tag: tags.derefOperator,
      color: "#fff"
    }
  ]
});

// node_modules/thememirror/dist/themes/cool-glow.js
var coolGlow = create_theme_default({
  variant: "dark",
  settings: {
    background: "#060521",
    foreground: "#E0E0E0",
    caret: "#FFFFFFA6",
    selection: "#122BBB",
    gutterBackground: "#060521",
    gutterForeground: "#E0E0E090",
    lineHighlight: "#FFFFFF0F"
  },
  styles: [
    {
      tag: tags.comment,
      color: "#AEAEAE"
    },
    {
      tag: [tags.string, tags.special(tags.brace), tags.regexp],
      color: "#8DFF8E"
    },
    {
      tag: [
        tags.className,
        tags.definition(tags.propertyName),
        tags.function(tags.variableName),
        tags.function(tags.definition(tags.variableName)),
        tags.definition(tags.typeName)
      ],
      color: "#A3EBFF"
    },
    {
      tag: [tags.number, tags.bool, tags.null],
      color: "#62E9BD"
    },
    {
      tag: [tags.keyword, tags.operator],
      color: "#2BF1DC"
    },
    {
      tag: [tags.definitionKeyword, tags.modifier],
      color: "#F8FBB1"
    },
    {
      tag: [tags.variableName, tags.self],
      color: "#B683CA"
    },
    {
      tag: [tags.angleBracket, tags.tagName, tags.typeName, tags.propertyName],
      color: "#60A4F1"
    },
    {
      tag: tags.derefOperator,
      color: "#E0E0E0"
    },
    {
      tag: tags.attributeName,
      color: "#7BACCA"
    }
  ]
});

// node_modules/thememirror/dist/themes/dracula.js
var dracula = create_theme_default({
  variant: "dark",
  settings: {
    background: "#2d2f3f",
    foreground: "#f8f8f2",
    caret: "#f8f8f0",
    selection: "#44475a",
    gutterBackground: "#282a36",
    gutterForeground: "rgb(144, 145, 148)",
    lineHighlight: "#44475a"
  },
  styles: [
    {
      tag: tags.comment,
      color: "#6272a4"
    },
    {
      tag: [tags.string, tags.special(tags.brace)],
      color: "#f1fa8c"
    },
    {
      tag: [tags.number, tags.self, tags.bool, tags.null],
      color: "#bd93f9"
    },
    {
      tag: [tags.keyword, tags.operator],
      color: "#ff79c6"
    },
    {
      tag: [tags.definitionKeyword, tags.typeName],
      color: "#8be9fd"
    },
    {
      tag: tags.definition(tags.typeName),
      color: "#f8f8f2"
    },
    {
      tag: [
        tags.className,
        tags.definition(tags.propertyName),
        tags.function(tags.variableName),
        tags.attributeName
      ],
      color: "#50fa7b"
    }
  ]
});

// node_modules/thememirror/dist/themes/espresso.js
var espresso = create_theme_default({
  variant: "light",
  settings: {
    background: "#FFFFFF",
    foreground: "#000000",
    caret: "#000000",
    selection: "#80C7FF",
    gutterBackground: "#FFFFFF",
    gutterForeground: "#00000070",
    lineHighlight: "#C1E2F8"
  },
  styles: [
    {
      tag: tags.comment,
      color: "#AAAAAA"
    },
    {
      tag: [tags.keyword, tags.operator, tags.typeName, tags.tagName, tags.propertyName],
      color: "#2F6F9F",
      fontWeight: "bold"
    },
    {
      tag: [tags.attributeName, tags.definition(tags.propertyName)],
      color: "#4F9FD0"
    },
    {
      tag: [tags.className, tags.string, tags.special(tags.brace)],
      color: "#CF4F5F"
    },
    {
      tag: tags.number,
      color: "#CF4F5F",
      fontWeight: "bold"
    },
    {
      tag: tags.variableName,
      fontWeight: "bold"
    }
  ]
});

// node_modules/thememirror/dist/themes/noctis-lilac.js
var noctisLilac = create_theme_default({
  variant: "light",
  settings: {
    background: "#f2f1f8",
    foreground: "#0c006b",
    caret: "#5c49e9",
    selection: "#d5d1f2",
    gutterBackground: "#f2f1f8",
    gutterForeground: "#0c006b70",
    lineHighlight: "#e1def3"
  },
  styles: [
    {
      tag: tags.comment,
      color: "#9995b7"
    },
    {
      tag: tags.keyword,
      color: "#ff5792",
      fontWeight: "bold"
    },
    {
      tag: [tags.definitionKeyword, tags.modifier],
      color: "#ff5792"
    },
    {
      tag: [tags.className, tags.tagName, tags.definition(tags.typeName)],
      color: "#0094f0"
    },
    {
      tag: [tags.number, tags.bool, tags.null, tags.special(tags.brace)],
      color: "#5842ff"
    },
    {
      tag: [tags.definition(tags.propertyName), tags.function(tags.variableName)],
      color: "#0095a8"
    },
    {
      tag: tags.typeName,
      color: "#b3694d"
    },
    {
      tag: [tags.propertyName, tags.variableName],
      color: "#fa8900"
    },
    {
      tag: tags.operator,
      color: "#ff5792"
    },
    {
      tag: tags.self,
      color: "#e64100"
    },
    {
      tag: [tags.string, tags.regexp],
      color: "#00b368"
    },
    {
      tag: [tags.paren, tags.bracket],
      color: "#0431fa"
    },
    {
      tag: tags.labelName,
      color: "#00bdd6"
    },
    {
      tag: tags.attributeName,
      color: "#e64100"
    },
    {
      tag: tags.angleBracket,
      color: "#9995b7"
    }
  ]
});

// node_modules/thememirror/dist/themes/rose-pine-dawn.js
var rosePineDawn = create_theme_default({
  variant: "light",
  settings: {
    background: "#faf4ed",
    foreground: "#575279",
    caret: "#575279",
    selection: "#6e6a8614",
    gutterBackground: "#faf4ed",
    gutterForeground: "#57527970",
    lineHighlight: "#6e6a860d"
  },
  styles: [
    {
      tag: tags.comment,
      color: "#9893a5"
    },
    {
      tag: [tags.bool, tags.null],
      color: "#286983"
    },
    {
      tag: tags.number,
      color: "#d7827e"
    },
    {
      tag: tags.className,
      color: "#d7827e"
    },
    {
      tag: [tags.angleBracket, tags.tagName, tags.typeName],
      color: "#56949f"
    },
    {
      tag: tags.attributeName,
      color: "#907aa9"
    },
    {
      tag: tags.punctuation,
      color: "#797593"
    },
    {
      tag: [tags.keyword, tags.modifier],
      color: "#286983"
    },
    {
      tag: [tags.string, tags.regexp],
      color: "#ea9d34"
    },
    {
      tag: tags.variableName,
      color: "#d7827e"
    }
  ]
});

// node_modules/thememirror/dist/themes/smoothy.js
var smoothy = create_theme_default({
  variant: "light",
  settings: {
    background: "#FFFFFF",
    foreground: "#000000",
    caret: "#000000",
    selection: "#FFFD0054",
    gutterBackground: "#FFFFFF",
    gutterForeground: "#00000070",
    lineHighlight: "#00000008"
  },
  styles: [
    {
      tag: tags.comment,
      color: "#CFCFCF"
    },
    {
      tag: [tags.number, tags.bool, tags.null],
      color: "#E66C29"
    },
    {
      tag: [
        tags.className,
        tags.definition(tags.propertyName),
        tags.function(tags.variableName),
        tags.labelName,
        tags.definition(tags.typeName)
      ],
      color: "#2EB43B"
    },
    {
      tag: tags.keyword,
      color: "#D8B229"
    },
    {
      tag: tags.operator,
      color: "#4EA44E",
      fontWeight: "bold"
    },
    {
      tag: [tags.definitionKeyword, tags.modifier],
      color: "#925A47"
    },
    {
      tag: tags.string,
      color: "#704D3D"
    },
    {
      tag: tags.typeName,
      color: "#2F8996"
    },
    {
      tag: [tags.variableName, tags.propertyName],
      color: "#77ACB0"
    },
    {
      tag: tags.self,
      color: "#77ACB0",
      fontWeight: "bold"
    },
    {
      tag: tags.regexp,
      color: "#E3965E"
    },
    {
      tag: [tags.tagName, tags.angleBracket],
      color: "#BAA827"
    },
    {
      tag: tags.attributeName,
      color: "#B06520"
    },
    {
      tag: tags.derefOperator,
      color: "#000"
    }
  ]
});

// node_modules/thememirror/dist/themes/solarized-light.js
var solarizedLight = create_theme_default({
  variant: "light",
  settings: {
    background: "#fef7e5",
    foreground: "#586E75",
    caret: "#000000",
    selection: "#073642",
    gutterBackground: "#fef7e5",
    gutterForeground: "#586E7580",
    lineHighlight: "#EEE8D5"
  },
  styles: [
    {
      tag: tags.comment,
      color: "#93A1A1"
    },
    {
      tag: tags.string,
      color: "#2AA198"
    },
    {
      tag: tags.regexp,
      color: "#D30102"
    },
    {
      tag: tags.number,
      color: "#D33682"
    },
    {
      tag: tags.variableName,
      color: "#268BD2"
    },
    {
      tag: [tags.keyword, tags.operator, tags.punctuation],
      color: "#859900"
    },
    {
      tag: [tags.definitionKeyword, tags.modifier],
      color: "#073642",
      fontWeight: "bold"
    },
    {
      tag: [tags.className, tags.self, tags.definition(tags.propertyName)],
      color: "#268BD2"
    },
    {
      tag: tags.function(tags.variableName),
      color: "#268BD2"
    },
    {
      tag: [tags.bool, tags.null],
      color: "#B58900"
    },
    {
      tag: tags.tagName,
      color: "#268BD2",
      fontWeight: "bold"
    },
    {
      tag: tags.angleBracket,
      color: "#93A1A1"
    },
    {
      tag: tags.attributeName,
      color: "#93A1A1"
    },
    {
      tag: tags.typeName,
      color: "#859900"
    }
  ]
});

// node_modules/thememirror/dist/themes/tomorrow.js
var tomorrow = create_theme_default({
  variant: "light",
  settings: {
    background: "#FFFFFF",
    foreground: "#4D4D4C",
    caret: "#AEAFAD",
    selection: "#D6D6D6",
    gutterBackground: "#FFFFFF",
    gutterForeground: "#4D4D4C80",
    lineHighlight: "#EFEFEF"
  },
  styles: [
    {
      tag: tags.comment,
      color: "#8E908C"
    },
    {
      tag: [tags.variableName, tags.self, tags.propertyName, tags.attributeName, tags.regexp],
      color: "#C82829"
    },
    {
      tag: [tags.number, tags.bool, tags.null],
      color: "#F5871F"
    },
    {
      tag: [tags.className, tags.typeName, tags.definition(tags.typeName)],
      color: "#C99E00"
    },
    {
      tag: [tags.string, tags.special(tags.brace)],
      color: "#718C00"
    },
    {
      tag: tags.operator,
      color: "#3E999F"
    },
    {
      tag: [tags.definition(tags.propertyName), tags.function(tags.variableName)],
      color: "#4271AE"
    },
    {
      tag: tags.keyword,
      color: "#8959A8"
    },
    {
      tag: tags.derefOperator,
      color: "#4D4D4C"
    }
  ]
});
export {
  amy,
  ayuLight,
  barf,
  bespin,
  birdsOfParadise,
  boysAndGirls,
  clouds,
  cobalt,
  coolGlow,
  create_theme_default as createTheme,
  dracula,
  espresso,
  noctisLilac,
  rosePineDawn,
  smoothy,
  solarizedLight,
  tomorrow
};
//# sourceMappingURL=thememirror.js.map
