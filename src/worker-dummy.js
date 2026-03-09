export default {
    async fetch(request, env) {
      const url = new URL(request.url);
      if (url.pathname.startsWith('/api/')) {
        // TODO: Add API logic here
        return new Response('API not implemented', { status: 501 });
      }
      // Start serving static assets
      try {
        return env.ASSETS.fetch(request);
      } catch (e) {
        return new Response('Not Found', { status: 404 });
      }
    },
  };