export default function checkEnvironment(): string {
  const envUrl =
    process.env.NODE_ENV === 'development'
      ? 'https://dash.agileflow.tech'
      : 'https://dash.agileflow.tech';

  return envUrl;
}
