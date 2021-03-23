export default interface Command {
  title: string;
  icon: string;

  action(): void;
  disabled: boolean;
}
