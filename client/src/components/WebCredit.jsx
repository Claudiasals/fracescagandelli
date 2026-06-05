const WebCredit = ({ className = "" }) => (
  <p className={`site-web-credit normal-case ${className}`.trim()}>
    Sviluppo web:{" "}
    <a
      href="https://claudiasalsini.dev"
      target="_blank"
      rel="noopener noreferrer"
      className="underline transition-opacity hover:opacity-70"
    >
      Claudia Salsini
    </a>
  </p>
);

export default WebCredit;
