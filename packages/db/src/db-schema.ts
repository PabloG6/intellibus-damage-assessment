import * as authSchema from "../auth.schema";
import * as appSchema from "./schema";

export const schema = {
  ...appSchema,
  ...authSchema,
};
