/* eslint-disable @typescript-eslint/no-var-requires */
const GoogleFontsPlugin = require("google-fonts-webpack-plugin");
const VuetifyLoaderPlugin = require("vuetify-loader/lib/plugin");

module.exports = {
  transpileDependencies: ["vuetify"],
  devServer: {
    proxy: {
      "^/api": {
        target: "http://localhost:5000/api",
        changeOrigin: true
      }
    }
  },
  pluginOptions: {
    electronBuilder: {
      mainProcessFile: "src/electronMain.ts",
      rendererProcessFile: "src/electronRenderer.ts",
      chainWebpackRendererProcess: config => {
        config.plugin("copy").tap(args => {
          // Clear the multi-page build settings while building the electron client so we get the correct entrypoint.
          config.pages = {};

          args[0].push({ from: "src/preload.js", to: "" }); // copy to the root of the app.asar file
          return args;
        });
      },
      builderOptions: {
        appId: "cequel.space",
        productName: "Ceqel.Space",
        mac: {
          icon: "assets/icon.icns"
        }
      }
    }
  },
  chainWebpack: config => {
    {
      config.plugin("VuetifyLoaderPlugin");

      new GoogleFontsPlugin({
        fonts: [
          {
            family: "Roboto",
            variants: ["100", "300", "400", "500", "700", "900"]
          }
        ],
        formats: ["woff2"],
        stats: false
      });

      config.plugin('copy').tap(args => {
        args[0][0].ignore.push("config.json");
        return args;
      });
    
    }
  },
  pages: {
    app: {
      entry: "src/browserMain.ts",
      template: "public/index.html",
      filename: "index.html",
      excludeChunks: ["oidc-silent-renew"]
    },
    oidcsilentrenew: {
      entry: "src/oidc-silent-renew.js",
      template: "public/oidc-silent-renew.html",
      filename: "oidc-silent-renew.html",
      excludeChunks: ["app"]
    }
  }
};
