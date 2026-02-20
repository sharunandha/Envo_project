# Contributing Guidelines

## Getting Started

1. Fork the repository
2. Clone your fork
3. Create a feature branch: `git checkout -b feature/your-feature`
4. Make your changes
5. Commit: `git commit -m "Add your feature"`
6. Push: `git push origin feature/your-feature`
7. Create a Pull Request

## Code Standards

### Backend (Node.js)
- Use ES6+ syntax
- Follow REST API conventions
- Add error handling with try-catch
- Document complex functions with JSDoc
- Use meaningful variable names

### Frontend (React)
- Use functional components with hooks
- Keep components focused and single-responsibility
- Add prop validation with PropTypes
- Use Tailwind CSS for styling
- Follow React best practices

## Testing

```bash
# Backend
cd backend
npm test  # (if tests added)

# Frontend
cd frontend
npm test  # (if tests added)
```

## Commit Messages

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style
- `refactor:` Code refactor
- `test:` Tests
- `chore:` Maintenance

Example: `feat: add PDF report export`

## Pull Request Process

1. Update README.md if needed
2. Add tests for new features
3. Ensure code passes linting
4. Request review from maintainers
5. Address feedback and re-request review

## Reporting Issues

Include:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details (OS, Node version, etc.)

---

Thank you for contributing! 🙏
