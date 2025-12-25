import { setDefaultOptions } from "date-fns";
import { zhTW } from "date-fns/locale";
import { render } from "solid-js/web";

import App from "./App.tsx";
import "./index.css";
import { sync } from "./sync.ts";

setDefaultOptions({ locale: zhTW });

sync();

const root = document.getElementById("root");

render(() => <App />, root!);
