import Identifiable from "./Identifiable";

export default interface BatchJob extends Identifiable {
  id: string | undefined;
  connectionId: string;
  query: string;
}
