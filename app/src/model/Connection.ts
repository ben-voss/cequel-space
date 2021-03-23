import Identifiable from "./Identifiable";

export default interface Connection extends Identifiable {
  id: string | undefined;
  name: string;

  hostName: string;
  port: number | null;
  database: string | null;

  username: string;
  password: string;
}
