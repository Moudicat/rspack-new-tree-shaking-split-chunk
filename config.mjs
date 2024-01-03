import path from "path";
import { fileURLToPath } from "url";
import { VueLoaderPlugin } from "vue-loader";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isRunningWebpack = !!process.env.WEBPACK;
const isRunningRspack = !!process.env.RSPACK;
if (!isRunningRspack && !isRunningWebpack) {
  throw new Error("Unknown bundler");
}

const DEPENDENCY_MATCH_TEMPL = /[\\/]node_modules[\\/](<SOURCES>)[\\/]/.source;

const createDependenciesRegExp = (
  ...dependencies
) => {
  const sources = dependencies.map((d) =>
    typeof d === 'string' ? d : d.source,
  );
  const expr = DEPENDENCY_MATCH_TEMPL.replace('<SOURCES>', sources.join('|'));
  return new RegExp(expr);
};


/**
 * @type {import('webpack').Configuration | import('@rspack/cli').Configuration}
 */
const config = {
  mode: "development",
  devtool: false,
  entry: {
		main: "./src/main.js"
	},
  optimization: {
		minimize: false,
		splitChunks: {
			chunks: 'all',
			minChunks: 1,
			minSize: 20000,
			cacheGroups: {
				vant: {
					name: 'lib-vant',
					test: createDependenciesRegExp('vant'),
					reuseExistingChunk: true,
					priority: 15,
				},
			}
		}
	},
  plugins: [new VueLoaderPlugin()],
  output: {
    clean: true,
    path: isRunningWebpack
      ? path.resolve(__dirname, "webpack-dist")
      : path.resolve(__dirname, "rspack-dist"),
    filename: "[name].js",
  },
  experiments: {
    css: true,
    ...isRunningRspack
      ? {
        rspackFuture: {
          // TODO
          newTreeshaking: true
        }
      } : {}
  },
  module: {
		rules: [
			{
				test: /\.vue$/,
				loader: "vue-loader",
				options: {
					experimentalInlineMatchResource: true
				}
			},
			{
				test: /\.(js|ts)$/,
				use: [
					{
						loader: isRunningRspack ? "builtin:swc-loader" : 'babel-loader',
						options: isRunningRspack ? {
							sourceMap: true,
							jsc: {
								parser: {
									syntax: "typescript",
									tsx: false
								}
							},
							env: {
								targets: [
									"chrome >= 87",
									"edge >= 88",
									"firefox >= 78",
									"safari >= 14"
								]
							}
						}: {}
					}
				]
			},
			{
				test: /\.svg/,
				type: "asset/resource"
			}
		]
	}
};

export default config;
