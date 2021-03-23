export interface RequestMessage {
  id: string;
  target: string;
  method: string;
  args: any;
}
