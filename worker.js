async function handleAuth(request, env) {
  const redirectUri = `${new URL(request.url).origin}/api/callback`;

  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", "repo,user");

  return Response.redirect(authorizeUrl.toString(), 302);
}

async function handleCallback(request, env) {
  const code = new URL(request.url).searchParams.get("code");

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const { access_token: token, error } = await tokenResponse.json();

  const message = error
    ? `authorization:github:error:${JSON.stringify({ error })}`
    : `authorization:github:success:${JSON.stringify({ token, provider: "github" })}`;

  const html = `<!doctype html><html><body><script>
    (function() {
      function receiveMessage(e) {
        window.removeEventListener("message", receiveMessage, false);
        window.opener.postMessage(${JSON.stringify(message)}, e.origin);
      }
      window.addEventListener("message", receiveMessage, false);
      window.opener.postMessage("authorizing:github", "*");
    })();
  </script></body></html>`;

  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/auth") return handleAuth(request, env);
    if (pathname === "/api/callback") return handleCallback(request, env);

    return env.ASSETS.fetch(request);
  },
};
