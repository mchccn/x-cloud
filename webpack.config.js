import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import("webpack").Configuration} */
export default {
    entry: "./app/index.ts",
    devtool: "inline-source-map",
    mode: "development",
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    {
                        loader: "ts-loader",
                        options: {
                            configFile: "tsconfig.app.json",
                        },
                    },
                ],
                exclude: [path.resolve(__dirname, "node_modules")],
            },
        ],
    },
    resolve: { extensions: [".ts"] },
    output: { filename: "index.js", path: path.resolve(__dirname, "app/dist"), asyncChunks: false },
    experiments: { topLevelAwait: true },
};
