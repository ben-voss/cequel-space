export default interface RecordSet {
  message: string | undefined;
  headers: string[] | undefined;
  data: (string | number | null)[][] | undefined;
}
