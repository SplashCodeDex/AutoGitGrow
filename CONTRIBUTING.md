# Contributing to AutoGitGrow

First off, thank you for considering contributing to AutoGitGrow! It's people like you that make the open source community such a great place. We welcome any and all contributions, from bug reports to feature requests.

## How to Contribute

1.  **Fork the repository** and create your branch from `main`.
2.  **Make your changes** and ensure that the code lints and builds.
3.  **Write tests** for your changes.
4.  **Create a pull request** with a clear description of your changes.

## Reporting Bugs

If you find a bug, please open an issue on GitHub. Please include the following information in your issue:

*   A clear and descriptive title.
*   A detailed description of the bug.
*   Steps to reproduce the bug.
*   The expected behavior.
*   The actual behavior.
*   Your operating system and browser.

## Suggesting Enhancements

If you have an idea for a new feature, please open an issue on GitHub. Please include the following information in your issue:

*   A clear and descriptive title.
*   A detailed description of the enhancement.
*   The problem that the enhancement solves.
*   Any alternative solutions or features you've considered.

## Code Contribution Guidelines

*   **Follow the existing code style.**
*   **Write clear and concise commit messages.**
*   **Write tests for your changes.**
*   **Ensure that your changes are well-documented.**
*   **Test Docker builds locally** before submitting PRs: `docker compose up --build`
*   **Verify CI/CD compatibility** - all PRs trigger automated testing and building

## Development Environment

### Local Development with Docker
```bash
# Clone and setup
git clone https://github.com/your-username/autogitgrow
cd autogitgrow

# Start development environment
docker compose up --build

# Run tests
docker compose -f docker-compose.test.yml up --build --abort-on-container-exit
```

### Production Testing
```bash
# Test deployment scripts
./deploy/deploy.sh docker-hub production

# Test specific platform configurations
docker build -t test-backend ./backend
docker build -t test-frontend .
```

## Deployment Contributions

### Adding New Deployment Platforms
1. Create platform configuration file (e.g., `platform.yaml`)
2. Add deployment logic to `deploy/deploy.sh`
3. Update `DEPLOYMENT_GUIDE.md` with platform details
4. Add platform to CI/CD workflow if supported
5. Test deployment thoroughly before submitting PR

### CI/CD Improvements
- All CI/CD changes should be tested in a fork first
- Update documentation when adding new workflows
- Ensure backward compatibility with existing deployments
- Add appropriate error handling and logging

## Code of Conduct

Please note that this project is released with a Contributor Code of Conduct. By participating in this project you agree to abide by its terms.
