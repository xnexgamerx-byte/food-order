import serverless from "serverless-http";
import app from "../../artifacts/api-server/src/app.js";

export const handler = serverless(app, {
  request(req: any) {
    if (!req.url?.startsWith("/api")) {
      req.url = `/api${req.url}`;
    }
  },
});
