import { setDefaultOptions } from "date-fns";
import { zhTW } from "date-fns/locale";
import { Show, createSignal } from "solid-js";
import { render } from "solid-js/web";

import App from "./App";
import { client } from "./client";
import Button from "./components/Button";
import "./index.css";

setDefaultOptions({ locale: zhTW });

const root = document.getElementById("root");

type Status = "checking" | "callback" | "loggedIn" | "anonymous";

render(() => {
  const isCallback =
    window.location.pathname === `${import.meta.env.BASE_URL}callback`;
  const [authStatus, setAuthStatus] = createSignal<Status>(
    isCallback ? "callback" : "checking"
  );

  return (
    <>
      <Show when={authStatus() === "callback"}>
        <Callback setAuthStatus={setAuthStatus} />
      </Show>
      <Show when={authStatus() === "checking"}>
        <Checking setAuthStatus={setAuthStatus} />
      </Show>
      <Show when={authStatus() === "anonymous"}>
        <Login />
      </Show>
      <Show when={authStatus() === "loggedIn"}>
        <App />
      </Show>
    </>
  );
}, root!);

function Checking(props: { setAuthStatus: (status: Status) => void }) {
  async function checkAuth() {
    const result = await client.api.me.get();
    if (result.data) {
      props.setAuthStatus("loggedIn");
    } else {
      props.setAuthStatus("anonymous");
    }
  }

  checkAuth();

  return <div>Checking authentication status...</div>;
}

function Login() {
  function startGoogleLogin() {
    const state = crypto.randomUUID();
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set(
      "client_id",
      import.meta.env.VITE_GOOGLE_CLIENT_ID
    );
    authUrl.searchParams.set(
      "redirect_uri",
      `${window.location.origin}${import.meta.env.BASE_URL}callback`
    );
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "profile email openid");
    authUrl.searchParams.set("access_type", "online");
    authUrl.searchParams.set("state", state);
    localStorage.setItem("oauthState", state);
    window.location.href = authUrl.toString();
  }

  return (
    <div class="h-screen w-screen flex items-center justify-center">
      <Button onClick={startGoogleLogin}>使用 google 登入</Button>
    </div>
  );
}

function Callback(props: { setAuthStatus: (status: Status) => void }) {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  const state = urlParams.get("state");
  const storedState = localStorage.getItem("oauthState");

  if (state !== storedState) {
    return <div>Invalid state</div>;
  }

  if (!code) {
    return <div>No code provided</div>;
  }

  async function exchangeCodeForToken(code: string) {
    const result = await client.api.login.post({
      code,
      redirect_uri: `${window.location.origin}${import.meta.env.BASE_URL}callback`,
    });

    if (result.data) {
      history.replaceState(null, "", import.meta.env.BASE_URL);
      props.setAuthStatus("loggedIn");
    }
    return;
  }

  exchangeCodeForToken(code);

  return <div>Callback Page</div>;
}
