<img width="1280" height="640" alt="boundless-os-og" src="https://github.com/user-attachments/assets/f70671a2-66e8-4c80-8998-d4318af55d10" />

# Boundless OS

**Transform AI coding agents from confused interns into productive developers**

Boundless OS is a structured development framework that guides AI coding assistants (Claude Code, Cursor, Windsurf) through proven workflows to build production-ready code that matches your standards—every time.

[![GitHub Stars](https://img.shields.io/github/stars/buildermethods/boundless-os?style=social)](https://github.com/buildermethods/boundless-os)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-2.1.1-blue.svg)](CHANGELOG.md)

---

## 🎯 The Problem

Without Boundless OS, AI agents:
- Generate inconsistent code that doesn't match your style
- Make architectural decisions without understanding your vision
- Produce implementations that work "technically" but aren't production-ready
- Require constant back-and-forth prompting

## ✨ The Solution

Boundless OS provides:
- **Standards** - Your coding style, design principles, and best practices
- **Structured Workflows** - 6-phase process from idea to working code
- **Product Context** - Your mission, roadmap, and vision guide every decision
- **Specialized Agents** - Different AI agents for different tasks (planning, specs, implementing)

**Result**: Production-ready code that matches your standards on the first try.

---

## 🚀 Quick Start (30 Seconds)

### 1. Clone the Repository

```bash
git clone https://github.com/ryanbrazzell/boundless-os my-project
cd my-project
```

### 2. Open Claude Code

```bash
claude-code
```

### 3. Start Building

Type `/` and you'll see all available commands:
- `/plan-product` - Define your product mission and roadmap
- `/shape-spec` - Plan a new feature
- `/write-spec` - Write detailed specifications
- `/create-tasks` - Break down work into tasks
- `/implement-tasks` - Build the feature
- `/orchestrate-tasks` - Coordinate complex work

Run your first command:
```
/plan-product
```

**That's it!** The repository is ready to use immediately. No installation, no configuration, just start building.

---

## 📦 Adding to Existing Projects

Already have a project? Install Boundless OS into it:

```bash
# Clone the base (one time)
git clone https://github.com/ryanbrazzell/boundless-os ~/boundless-os

# Install into your project
cd ~/your-existing-project
~/boundless-os/scripts/project-install.sh --profile ryan
```

---

## 📚 Documentation

All documentation is available locally (no internet required):

### Getting Started
- **[QUICKSTART.md](QUICKSTART.md)** - Comprehensive getting started guide (read this first!)
- **[WORKFLOW.md](WORKFLOW.md)** - Understanding the 6-phase development process
- **[SETUP-MCP.md](SETUP-MCP.md)** - Required MCP tools (Context7, Playwright)

### Reference
- **[FAQ.md](FAQ.md)** - Frequently asked questions
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions
- **[GLOSSARY.md](GLOSSARY.md)** - Plain language explanations of technical terms
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and updates

### Additional Resources
- **[Official Website](https://buildermethods.com/boundless-os)** - Online documentation and guides
- **[GitHub Issues](https://github.com/buildermethods/boundless-os/issues)** - Report bugs or request features

---

## 💡 Key Features

### ✅ **Spec-Driven Development**
Stop going back and forth with AI. Define what you want once, get it right the first time.

### ✅ **Multiple AI Tools Supported**
Works with:
- **Claude Code** (recommended) - Best integration, multi-agent support
- **Cursor** - AI-first code editor
- **Windsurf** - Codeium's AI IDE
- **Any AI tool** that can read markdown files

### ✅ **Non-Technical Founder Friendly**
The "ryan" profile is specifically designed for founders without coding experience:
- Plain language communication (no jargon)
- S-tier design standards (Stripe/Notion quality)
- Visual testing (see it work, not just code)
- Security by default

### ✅ **Production-Ready Code**
Not prototypes—actual production code with:
- Tests included automatically
- Security best practices
- Accessible UI (screen readers, keyboard navigation)
- Professional design
- Error handling
- Comments in plain language

### ✅ **Any Language, Any Framework**
Boundless OS is language-agnostic. Supports:
- JavaScript/TypeScript (React, Next.js, Vue, etc.)
- Python (Django, FastAPI, etc.)
- Ruby (Rails), PHP (Laravel), Java (Spring Boot)
- And more—you choose the tech stack

---

## 🏗️ The 6-Phase Workflow

```
1. Plan Product    → Define mission, roadmap, tech stack (once per project)
2. Shape Spec      → Plan a feature through Q&A
3. Write Spec      → Convert to formal specification
4. Create Tasks    → Break into implementable tasks
5. Implement       → Build the feature (with tests!)
6. Verify          → Automatic quality & security checks

Result: Working feature in 1-3 hours (vs days of back-and-forth)
```

**See [WORKFLOW.md](WORKFLOW.md) for detailed explanation with examples.**

---

## 👥 Who Is This For?

### Perfect For:
- **Non-technical founders** with a product idea but no coding experience
- **Solo developers** building SaaS products, marketplaces, or tools
- **Small teams** wanting consistent code quality
- **Anyone** tired of prompting AI agents repeatedly

### You Should Use Boundless OS If:
- You want AI to build production-quality code, not prototypes
- You have (or need) clear standards for your codebase
- You're building something with multiple features
- You want structured workflows, not freeform prompting

---

## 🎓 Example: Building User Authentication

Traditional way (without Boundless OS):
```
You: "Build user authentication"
AI:  [generates code]
You: "No, I wanted it to look like Stripe's UI"
AI:  [rewrites everything]
You: "And it needs to use Clerk, not custom auth"
AI:  [starts over again]
... 4-5 iterations later ...
```

**With Boundless OS:**
```
You: /shape-spec user-authentication
AI:  [asks clarifying questions upfront]
     [checks your design standards]
     [creates formal specification]

You: /implement-tasks user-authentication
AI:  [builds exactly what was spec'd]
     [follows your design principles automatically]
     [uses Clerk per your tech stack]
     [tests everything]
     [Done in one pass!]
```

**See [QUICKSTART.md](QUICKSTART.md) for complete walkthrough.**

---

## 📦 What's Included

After installation, your project will have:

```
your-project/
├── .claude/
│   ├── commands/boundless-os/     # 6 main commands
│   └── agents/boundless-os/        # 8 specialized AI agents
├── boundless-os/
│   ├── standards/              # Coding standards & best practices
│   ├── product/                # Mission, roadmap, tech stack
│   ├── specs/                  # Feature specifications
│   └── config.yml              # Configuration
└── claude.md                   # Priority banner
```

**Total size**: ~2MB
**Installation time**: 30 seconds

---

## 🔧 Requirements

### Required:
- **Git** - For cloning the repository
- **AI Coding Tool** - Claude Code (recommended), Cursor, or Windsurf
- **Node.js** (for MCP tools) - Version 16+ recommended

### Highly Recommended MCP Tools:
- **Context7 MCP** ⚠️ REQUIRED - Documentation lookup
- **Playwright MCP** ⚠️ REQUIRED - Visual testing

**See [SETUP-MCP.md](SETUP-MCP.md) for installation instructions.**

---

## 🎨 Profiles

Boundless OS includes different profiles optimized for different users:

### **ryan** (for non-technical founders)
- Plain language communication
- S-tier design standards (Stripe/Notion quality)
- Visual testing with Playwright
- Security & code reviews automatic
- Opinionated tech stack (Next.js, Supabase, Clerk)

### **default** (for developers)
- Technical language OK
- Flexible design
- Mix of unit/integration/e2e testing
- Choose your own tech stack
- More customization options

**Create custom profiles**: `~/boundless-os/scripts/create-profile.sh my-profile`

---

## 💻 Installation Options

### Method 1: Interactive Wizard (Recommended)
```bash
git clone https://github.com/buildermethods/boundless-os ~/boundless-os
cd ~/my-project
~/boundless-os/scripts/wizard-install.sh
```

### Method 2: Direct Installation
```bash
git clone https://github.com/buildermethods/boundless-os ~/boundless-os
cd ~/my-project
~/boundless-os/scripts/project-install.sh
```

### Method 3: With Options
```bash
~/boundless-os/scripts/project-install.sh \
  --profile ryan \
  --claude-code-commands true \
  --use-claude-code-subagents true
```

**See [QUICKSTART.md](QUICKSTART.md) for detailed installation guide.**

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Report bugs** - [Open an issue](https://github.com/buildermethods/boundless-os/issues/new)
2. **Suggest features** - Share your ideas in Issues
3. **Improve docs** - Fix typos, add examples, clarify instructions
4. **Share profiles** - Create and share custom profiles
5. **Submit PRs** - Fix bugs or add features

**Before contributing:**
- Read existing issues and discussions
- Test your changes with real projects
- Follow the existing code style
- Update documentation if needed

---

## 📈 Version History

**Current Version**: 2.1.1 (Released October 28, 2025)

See [CHANGELOG.md](CHANGELOG.md) for full version history and release notes.

---

## 🆘 Getting Help

**Having trouble?**

1. **Run health check**: `~/boundless-os/scripts/health-check.sh`
2. **Check docs**: See [Documentation](#-documentation) above
3. **Search issues**: [GitHub Issues](https://github.com/buildermethods/boundless-os/issues)
4. **Ask the community**: [GitHub Discussions](https://github.com/buildermethods/boundless-os/discussions)
5. **Report a bug**: [Open a new issue](https://github.com/buildermethods/boundless-os/issues/new)

---

## 📊 Stats

- **2.4k+** GitHub stars
- **452** forks
- **13** active contributors
- **11** releases
- **Free & Open Source** (MIT License)

---

## 🎯 Roadmap

What's coming:
- Enhanced multi-agent orchestration
- More pre-built profiles
- Integration with additional AI tools
- Expanded example library
- Improved docs and tutorials

**See [CHANGELOG.md](CHANGELOG.md) for detailed roadmap.**

---

## 📄 License

Boundless OS is open source software licensed under the [MIT License](LICENSE).

You're free to use Boundless OS for personal or commercial projects.

---

## 🌟 Created by Brian Casel @ Builder Methods

Created by [Brian Casel](https://briancasel.com), the creator of [Builder Methods](https://buildermethods.com), where Brian helps professional software developers and teams build with AI.

### Get Brian's Free Resources:
- **[Builder Briefing Newsletter](https://buildermethods.com)** - Weekly insights on building with AI
- **[YouTube Channel](https://youtube.com/@briancasel)** - Video tutorials and walkthroughs

### Join Builder Methods Pro:
Get official support and connect with a community of AI-first builders:
**[buildermethods.com/pro](https://buildermethods.com/pro)**

---

## 🚀 Ready to Start?

1. **Install**: `git clone https://github.com/buildermethods/boundless-os ~/boundless-os`
2. **Read**: [QUICKSTART.md](QUICKSTART.md) (10 minutes)
3. **Build**: Run `/plan-product` and start creating

**Questions?** Check [FAQ.md](FAQ.md) or [open an issue](https://github.com/buildermethods/boundless-os/issues/new).

**Happy building!** 🎉
