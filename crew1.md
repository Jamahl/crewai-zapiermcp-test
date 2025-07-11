crew1.md

# Installation

> Get started with CrewAI - Install, configure, and build your first AI crew

## Video Tutorial

Watch this video tutorial for a step-by-step demonstration of the installation process:

<iframe width="100%" height="400" src="https://www.youtube.com/embed/-kSOTtYzgEw" title="CrewAI Installation Guide" frameborder="0" style={{ borderRadius: '10px' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen />

## Text Tutorial

<Note>
  **Python Version Requirements**

  CrewAI requires `Python >=3.10 and <3.14`. Here's how to check your version:

  ```bash
  python3 --version
  ```

  If you need to update Python, visit [python.org/downloads](https://python.org/downloads)
</Note>

CrewAI uses the `uv` as its dependency management and package handling tool. It simplifies project setup and execution, offering a seamless experience.

If you haven't installed `uv` yet, follow **step 1** to quickly get it set up on your system, else you can skip to **step 2**.

<Steps>
  <Step title="Install uv">
    * **On macOS/Linux:**

      Use `curl` to download the script and execute it with `sh`:

      ```shell
      curl -LsSf https://astral.sh/uv/install.sh | sh
      ```

      If your system doesn't have `curl`, you can use `wget`:

      ```shell
      wget -qO- https://astral.sh/uv/install.sh | sh
      ```

    * **On Windows:**

      Use `irm` to download the script and `iex` to execute it:

      ```shell
      powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
      ```

      If you run into any issues, refer to [UV's installation guide](https://docs.astral.sh/uv/getting-started/installation/) for more information.
  </Step>

  <Step title="Install CrewAI 🚀">
    * Run the following command to install `crewai` CLI:

      ```shell
      uv tool install crewai
      ```

      <Warning>
        If you encounter a `PATH` warning, run this command to update your shell:

        ```shell
        uv tool update-shell
        ```
      </Warning>

      <Warning>
        If you encounter the `chroma-hnswlib==0.7.6` build error (`fatal error C1083: Cannot open include file: 'float.h'`) on Windows, install [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/) with *Desktop development with C++*.
      </Warning>

    * To verify that `crewai` is installed, run:
      ```shell
      uv tool list
      ```

    * You should see something like:
      ```shell
      crewai v0.102.0
      - crewai
      ```

    * If you need to update `crewai`, run:
      ```shell
      uv tool install crewai --upgrade
      ```

    <Check>Installation successful! You're ready to create your first crew! 🎉</Check>
  </Step>
</Steps>

# Creating a CrewAI Project

We recommend using the `YAML` template scaffolding for a structured approach to defining agents and tasks. Here's how to get started:

<Steps>
  <Step title="Generate Project Scaffolding">
    * Run the `crewai` CLI command:
      ```shell
      crewai create crew <your_project_name>
      ```

    * This creates a new project with the following structure:
      ```
      my_project/
      ├── .gitignore
      ├── knowledge/
      ├── pyproject.toml
      ├── README.md
      ├── .env
      └── src/
          └── my_project/
              ├── __init__.py
              ├── main.py
              ├── crew.py
              ├── tools/
              │   ├── custom_tool.py
              │   └── __init__.py
              └── config/
                  ├── agents.yaml
                  └── tasks.yaml
      ```
  </Step>

  <Step title="Customize Your Project">
    * Your project will contain these essential files:
      | File          | Purpose                                  |
      | ------------- | ---------------------------------------- |
      | `agents.yaml` | Define your AI agents and their roles    |
      | `tasks.yaml`  | Set up agent tasks and workflows         |
      | `.env`        | Store API keys and environment variables |
      | `main.py`     | Project entry point and execution flow   |
      | `crew.py`     | Crew orchestration and coordination      |
      | `tools/`      | Directory for custom agent tools         |
      | `knowledge/`  | Directory for knowledge base             |

    * Start by editing `agents.yaml` and `tasks.yaml` to define your crew's behavior.

    * Keep sensitive information like API keys in `.env`.
  </Step>

  <Step title="Run your Crew">
    * Before you run your crew, make sure to run:
      ```bash
      crewai install
      ```
    * If you need to install additional packages, use:
      ```shell
      uv add <package-name>
      ```
    * To run your crew, execute the following command in the root of your project:
      ```bash
      crewai run
      ```
  </Step>
</Steps>

## Enterprise Installation Options

<Note type="info">
  For teams and organizations, CrewAI offers enterprise deployment options that eliminate setup complexity:

  ### CrewAI Enterprise (SaaS)

  * Zero installation required - just sign up for free at [app.crewai.com](https://app.crewai.com)
  * Automatic updates and maintenance
  * Managed infrastructure and scaling
  * Build Crews with no Code

  ### CrewAI Factory (Self-hosted)

  * Containerized deployment for your infrastructure
  * Supports any hyperscaler including on prem deployments
  * Integration with your existing security systems

  <Card title="Explore Enterprise Options" icon="building" href="https://crewai.com/enterprise">
    Learn about CrewAI's enterprise offerings and schedule a demo
  </Card>
</Note>

## Next Steps

<CardGroup cols={2}>
  <Card title="Build Your First Agent" icon="code" href="/en/quickstart">
    Follow our quickstart guide to create your first CrewAI agent and get hands-on experience.
  </Card>

  <Card title="Join the Community" icon="comments" href="https://community.crewai.com">
    Connect with other developers, get help, and share your CrewAI experiences.
  </Card>
</CardGroup>

--
# Quickstart

> Build your first AI agent with CrewAI in under 5 minutes.

## Build your first CrewAI Agent

Let's create a simple crew that will help us `research` and `report` on the `latest AI developments` for a given topic or subject.

Before we proceed, make sure you have finished installing CrewAI.
If you haven't installed them yet, you can do so by following the [installation guide](/en/installation).

Follow the steps below to get Crewing! 🚣‍♂️

<Steps>
  <Step title="Create your crew">
    Create a new crew project by running the following command in your terminal.
    This will create a new directory called `latest-ai-development` with the basic structure for your crew.

    <CodeGroup>
      ```shell Terminal
      crewai create crew latest-ai-development
      ```
    </CodeGroup>
  </Step>

  <Step title="Navigate to your new crew project">
    <CodeGroup>
      ```shell Terminal
      cd latest-ai-development
      ```
    </CodeGroup>
  </Step>

  <Step title="Modify your `agents.yaml` file">
    <Tip>
      You can also modify the agents as needed to fit your use case or copy and paste as is to your project.
      Any variable interpolated in your `agents.yaml` and `tasks.yaml` files like `{topic}` will be replaced by the value of the variable in the `main.py` file.
    </Tip>

    ```yaml agents.yaml
    # src/latest_ai_development/config/agents.yaml
    researcher:
      role: >
        {topic} Senior Data Researcher
      goal: >
        Uncover cutting-edge developments in {topic}
      backstory: >
        You're a seasoned researcher with a knack for uncovering the latest
        developments in {topic}. Known for your ability to find the most relevant
        information and present it in a clear and concise manner.

    reporting_analyst:
      role: >
        {topic} Reporting Analyst
      goal: >
        Create detailed reports based on {topic} data analysis and research findings
      backstory: >
        You're a meticulous analyst with a keen eye for detail. You're known for
        your ability to turn complex data into clear and concise reports, making
        it easy for others to understand and act on the information you provide.
    ```
  </Step>

  <Step title="Modify your `tasks.yaml` file">
    ````yaml tasks.yaml
    # src/latest_ai_development/config/tasks.yaml
    research_task:
      description: >
        Conduct a thorough research about {topic}
        Make sure you find any interesting and relevant information given
        the current year is 2025.
      expected_output: >
        A list with 10 bullet points of the most relevant information about {topic}
      agent: researcher

    reporting_task:
      description: >
        Review the context you got and expand each topic into a full section for a report.
        Make sure the report is detailed and contains any and all relevant information.
      expected_output: >
        A fully fledge reports with the mains topics, each with a full section of information.
        Formatted as markdown without '```'
      agent: reporting_analyst
      output_file: report.md
    ````
  </Step>

  <Step title="Modify your `crew.py` file">
    ```python crew.py
    # src/latest_ai_development/crew.py
    from crewai import Agent, Crew, Process, Task
    from crewai.project import CrewBase, agent, crew, task
    from crewai_tools import SerperDevTool
    from crewai.agents.agent_builder.base_agent import BaseAgent
    from typing import List

    @CrewBase
    class LatestAiDevelopmentCrew():
      """LatestAiDevelopment crew"""

      agents: List[BaseAgent]
      tasks: List[Task]

      @agent
      def researcher(self) -> Agent:
        return Agent(
          config=self.agents_config['researcher'], # type: ignore[index]
          verbose=True,
          tools=[SerperDevTool()]
        )

      @agent
      def reporting_analyst(self) -> Agent:
        return Agent(
          config=self.agents_config['reporting_analyst'], # type: ignore[index]
          verbose=True
        )

      @task
      def research_task(self) -> Task:
        return Task(
          config=self.tasks_config['research_task'], # type: ignore[index]
        )

      @task
      def reporting_task(self) -> Task:
        return Task(
          config=self.tasks_config['reporting_task'], # type: ignore[index]
          output_file='output/report.md' # This is the file that will be contain the final report.
        )

      @crew
      def crew(self) -> Crew:
        """Creates the LatestAiDevelopment crew"""
        return Crew(
          agents=self.agents, # Automatically created by the @agent decorator
          tasks=self.tasks, # Automatically created by the @task decorator
          process=Process.sequential,
          verbose=True,
        )
    ```
  </Step>

  <Step title="[Optional] Add before and after crew functions">
    ```python crew.py
    # src/latest_ai_development/crew.py
    from crewai import Agent, Crew, Process, Task
    from crewai.project import CrewBase, agent, crew, task, before_kickoff, after_kickoff
    from crewai_tools import SerperDevTool

    @CrewBase
    class LatestAiDevelopmentCrew():
      """LatestAiDevelopment crew"""

      @before_kickoff
      def before_kickoff_function(self, inputs):
        print(f"Before kickoff function with inputs: {inputs}")
        return inputs # You can return the inputs or modify them as needed

      @after_kickoff
      def after_kickoff_function(self, result):
        print(f"After kickoff function with result: {result}")
        return result # You can return the result or modify it as needed

      # ... remaining code
    ```
  </Step>

  <Step title="Feel free to pass custom inputs to your crew">
    For example, you can pass the `topic` input to your crew to customize the research and reporting.

    ```python main.py
    #!/usr/bin/env python
    # src/latest_ai_development/main.py
    import sys
    from latest_ai_development.crew import LatestAiDevelopmentCrew

    def run():
      """
      Run the crew.
      """
      inputs = {
        'topic': 'AI Agents'
      }
      LatestAiDevelopmentCrew().crew().kickoff(inputs=inputs)
    ```
  </Step>

  <Step title="Set your environment variables">
    Before running your crew, make sure you have the following keys set as environment variables in your `.env` file:

    * A [Serper.dev](https://serper.dev/) API key: `SERPER_API_KEY=YOUR_KEY_HERE`
    * The configuration for your choice of model, such as an API key. See the
      [LLM setup guide](/en/concepts/llms#setting-up-your-llm) to learn how to configure models from any provider.
  </Step>

  <Step title="Lock and install the dependencies">
    * Lock the dependencies and install them by using the CLI command:
      <CodeGroup>
        ```shell Terminal
        crewai install
        ```
      </CodeGroup>
    * If you have additional packages that you want to install, you can do so by running:
      <CodeGroup>
        ```shell Terminal
        uv add <package-name>
        ```
      </CodeGroup>
  </Step>

  <Step title="Run your crew">
    * To run your crew, execute the following command in the root of your project:
      <CodeGroup>
        ```bash Terminal
        crewai run
        ```
      </CodeGroup>
  </Step>

  <Step title="Enterprise Alternative: Create in Crew Studio">
    For CrewAI Enterprise users, you can create the same crew without writing code:

    1. Log in to your CrewAI Enterprise account (create a free account at [app.crewai.com](https://app.crewai.com))
    2. Open Crew Studio
    3. Type what is the automation you're trying to build
    4. Create your tasks visually and connect them in sequence
    5. Configure your inputs and click "Download Code" or "Deploy"

    ![Crew Studio Quickstart](https://mintlify.s3.us-west-1.amazonaws.com/crewai/images/enterprise/crew-studio-interface.png)

    <Card title="Try CrewAI Enterprise" icon="rocket" href="https://app.crewai.com">
      Start your free account at CrewAI Enterprise
    </Card>
  </Step>

  <Step title="View your final report">
    You should see the output in the console and the `report.md` file should be created in the root of your project with the final report.

    Here's an example of what the report should look like:

    <CodeGroup>
      ```markdown output/report.md
      # Comprehensive Report on the Rise and Impact of AI Agents in 2025

      ## 1. Introduction to AI Agents
      In 2025, Artificial Intelligence (AI) agents are at the forefront of innovation across various industries. As intelligent systems that can perform tasks typically requiring human cognition, AI agents are paving the way for significant advancements in operational efficiency, decision-making, and overall productivity within sectors like Human Resources (HR) and Finance. This report aims to detail the rise of AI agents, their frameworks, applications, and potential implications on the workforce.

      ## 2. Benefits of AI Agents
      AI agents bring numerous advantages that are transforming traditional work environments. Key benefits include:

      - **Task Automation**: AI agents can carry out repetitive tasks such as data entry, scheduling, and payroll processing without human intervention, greatly reducing the time and resources spent on these activities.
      - **Improved Efficiency**: By quickly processing large datasets and performing analyses that would take humans significantly longer, AI agents enhance operational efficiency. This allows teams to focus on strategic tasks that require higher-level thinking.
      - **Enhanced Decision-Making**: AI agents can analyze trends and patterns in data, provide insights, and even suggest actions, helping stakeholders make informed decisions based on factual data rather than intuition alone.

      ## 3. Popular AI Agent Frameworks
      Several frameworks have emerged to facilitate the development of AI agents, each with its own unique features and capabilities. Some of the most popular frameworks include:

      - **Autogen**: A framework designed to streamline the development of AI agents through automation of code generation.
      - **Semantic Kernel**: Focuses on natural language processing and understanding, enabling agents to comprehend user intentions better.
      - **Promptflow**: Provides tools for developers to create conversational agents that can navigate complex interactions seamlessly.
      - **Langchain**: Specializes in leveraging various APIs to ensure agents can access and utilize external data effectively.
      - **CrewAI**: Aimed at collaborative environments, CrewAI strengthens teamwork by facilitating communication through AI-driven insights.
      - **MemGPT**: Combines memory-optimized architectures with generative capabilities, allowing for more personalized interactions with users.

      These frameworks empower developers to build versatile and intelligent agents that can engage users, perform advanced analytics, and execute various tasks aligned with organizational goals.

      ## 4. AI Agents in Human Resources
      AI agents are revolutionizing HR practices by automating and optimizing key functions:

      - **Recruiting**: AI agents can screen resumes, schedule interviews, and even conduct initial assessments, thus accelerating the hiring process while minimizing biases.
      - **Succession Planning**: AI systems analyze employee performance data and potential, helping organizations identify future leaders and plan appropriate training.
      - **Employee Engagement**: Chatbots powered by AI can facilitate feedback loops between employees and management, promoting an open culture and addressing concerns promptly.

      As AI continues to evolve, HR departments leveraging these agents can realize substantial improvements in both efficiency and employee satisfaction.

      ## 5. AI Agents in Finance
      The finance sector is seeing extensive integration of AI agents that enhance financial practices:

      - **Expense Tracking**: Automated systems manage and monitor expenses, flagging anomalies and offering recommendations based on spending patterns.
      - **Risk Assessment**: AI models assess credit risk and uncover potential fraud by analyzing transaction data and behavioral patterns.
      - **Investment Decisions**: AI agents provide stock predictions and analytics based on historical data and current market conditions, empowering investors with informative insights.

      The incorporation of AI agents into finance is fostering a more responsive and risk-aware financial landscape.

      ## 6. Market Trends and Investments
      The growth of AI agents has attracted significant investment, especially amidst the rising popularity of chatbots and generative AI technologies. Companies and entrepreneurs are eager to explore the potential of these systems, recognizing their ability to streamline operations and improve customer engagement.

      Conversely, corporations like Microsoft are taking strides to integrate AI agents into their product offerings, with enhancements to their Copilot 365 applications. This strategic move emphasizes the importance of AI literacy in the modern workplace and indicates the stabilizing of AI agents as essential business tools.

      ## 7. Future Predictions and Implications
      Experts predict that AI agents will transform essential aspects of work life. As we look toward the future, several anticipated changes include:

      - Enhanced integration of AI agents across all business functions, creating interconnected systems that leverage data from various departmental silos for comprehensive decision-making.
      - Continued advancement of AI technologies, resulting in smarter, more adaptable agents capable of learning and evolving from user interactions.
      - Increased regulatory scrutiny to ensure ethical use, especially concerning data privacy and employee surveillance as AI agents become more prevalent.

      To stay competitive and harness the full potential of AI agents, organizations must remain vigilant about latest developments in AI technology and consider continuous learning and adaptation in their strategic planning.

      ## 8. Conclusion
      The emergence of AI agents is undeniably reshaping the workplace landscape in 5. With their ability to automate tasks, enhance efficiency, and improve decision-making, AI agents are critical in driving operational success. Organizations must embrace and adapt to AI developments to thrive in an increasingly digital business environment.
      ```
    </CodeGroup>
  </Step>
</Steps>

<Check>
  Congratulations!

  You have successfully set up your crew project and are ready to start building your own agentic workflows!
</Check>

### Note on Consistency in Naming

The names you use in your YAML files (`agents.yaml` and `tasks.yaml`) should match the method names in your Python code.
For example, you can reference the agent for specific tasks from `tasks.yaml` file.
This naming consistency allows CrewAI to automatically link your configurations with your code; otherwise, your task won't recognize the reference properly.

#### Example References

<Tip>
  Note how we use the same name for the agent in the `agents.yaml` (`email_summarizer`) file as the method name in the `crew.py` (`email_summarizer`) file.
</Tip>

```yaml agents.yaml
email_summarizer:
    role: >
      Email Summarizer
    goal: >
      Summarize emails into a concise and clear summary
    backstory: >
      You will create a 5 bullet point summary of the report
    llm: provider/model-id  # Add your choice of model here
```

<Tip>
  Note how we use the same name for the task in the `tasks.yaml` (`email_summarizer_task`) file as the method name in the `crew.py` (`email_summarizer_task`) file.
</Tip>

```yaml tasks.yaml
email_summarizer_task:
    description: >
      Summarize the email into a 5 bullet point summary
    expected_output: >
      A 5 bullet point summary of the email
    agent: email_summarizer
    context:
      - reporting_task
      - research_task
```

## Deploying Your Crew

The easiest way to deploy your crew to production is through [CrewAI Enterprise](http://app.crewai.com).

Watch this video tutorial for a step-by-step demonstration of deploying your crew to [CrewAI Enterprise](http://app.crewai.com) using the CLI.

<iframe width="100%" height="400" src="https://www.youtube.com/embed/3EqSV-CYDZA" title="CrewAI Deployment Guide" frameborder="0" style={{ borderRadius: '10px' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen />

<CardGroup cols={2}>
  <Card title="Deploy on Enterprise" icon="rocket" href="http://app.crewai.com">
    Get started with CrewAI Enterprise and deploy your crew in a production environment with just a few clicks.
  </Card>

  <Card title="Join the Community" icon="comments" href="https://community.crewai.com">
    Join our open source community to discuss ideas, share your projects, and connect with other CrewAI developers.
  </Card>
</CardGroup>
--

# Crafting Effective Agents

> Learn best practices for designing powerful, specialized AI agents that collaborate effectively to solve complex problems.

## The Art and Science of Agent Design

At the heart of CrewAI lies the agent - a specialized AI entity designed to perform specific roles within a collaborative framework. While creating basic agents is simple, crafting truly effective agents that produce exceptional results requires understanding key design principles and best practices.

This guide will help you master the art of agent design, enabling you to create specialized AI personas that collaborate effectively, think critically, and produce high-quality outputs tailored to your specific needs.

### Why Agent Design Matters

The way you define your agents significantly impacts:

1. **Output quality**: Well-designed agents produce more relevant, high-quality results
2. **Collaboration effectiveness**: Agents with complementary skills work together more efficiently
3. **Task performance**: Agents with clear roles and goals execute tasks more effectively
4. **System scalability**: Thoughtfully designed agents can be reused across multiple crews and contexts

Let's explore best practices for creating agents that excel in these dimensions.

## The 80/20 Rule: Focus on Tasks Over Agents

When building effective AI systems, remember this crucial principle: **80% of your effort should go into designing tasks, and only 20% into defining agents**.

Why? Because even the most perfectly defined agent will fail with poorly designed tasks, but well-designed tasks can elevate even a simple agent. This means:

* Spend most of your time writing clear task instructions
* Define detailed inputs and expected outputs
* Add examples and context to guide execution
* Dedicate the remaining time to agent role, goal, and backstory

This doesn't mean agent design isn't important - it absolutely is. But task design is where most execution failures occur, so prioritize accordingly.

## Core Principles of Effective Agent Design

### 1. The Role-Goal-Backstory Framework

The most powerful agents in CrewAI are built on a strong foundation of three key elements:

#### Role: The Agent's Specialized Function

The role defines what the agent does and their area of expertise. When crafting roles:

* **Be specific and specialized**: Instead of "Writer," use "Technical Documentation Specialist" or "Creative Storyteller"
* **Align with real-world professions**: Base roles on recognizable professional archetypes
* **Include domain expertise**: Specify the agent's field of knowledge (e.g., "Financial Analyst specializing in market trends")

**Examples of effective roles:**

```yaml
role: "Senior UX Researcher specializing in user interview analysis"
role: "Full-Stack Software Architect with expertise in distributed systems"
role: "Corporate Communications Director specializing in crisis management"
```

#### Goal: The Agent's Purpose and Motivation

The goal directs the agent's efforts and shapes their decision-making process. Effective goals should:

* **Be clear and outcome-focused**: Define what the agent is trying to achieve
* **Emphasize quality standards**: Include expectations about the quality of work
* **Incorporate success criteria**: Help the agent understand what "good" looks like

**Examples of effective goals:**

```yaml
goal: "Uncover actionable user insights by analyzing interview data and identifying recurring patterns, unmet needs, and improvement opportunities"
goal: "Design robust, scalable system architectures that balance performance, maintainability, and cost-effectiveness"
goal: "Craft clear, empathetic crisis communications that address stakeholder concerns while protecting organizational reputation"
```

#### Backstory: The Agent's Experience and Perspective

The backstory gives depth to the agent, influencing how they approach problems and interact with others. Good backstories:

* **Establish expertise and experience**: Explain how the agent gained their skills
* **Define working style and values**: Describe how the agent approaches their work
* **Create a cohesive persona**: Ensure all elements of the backstory align with the role and goal

**Examples of effective backstories:**

```yaml
backstory: "You have spent 15 years conducting and analyzing user research for top tech companies. You have a talent for reading between the lines and identifying patterns that others miss. You believe that good UX is invisible and that the best insights come from listening to what users don't say as much as what they do say."

backstory: "With 20+ years of experience building distributed systems at scale, you've developed a pragmatic approach to software architecture. You've seen both successful and failed systems and have learned valuable lessons from each. You balance theoretical best practices with practical constraints and always consider the maintenance and operational aspects of your designs."

backstory: "As a seasoned communications professional who has guided multiple organizations through high-profile crises, you understand the importance of transparency, speed, and empathy in crisis response. You have a methodical approach to crafting messages that address concerns while maintaining organizational credibility."
```

### 2. Specialists Over Generalists

Agents perform significantly better when given specialized roles rather than general ones. A highly focused agent delivers more precise, relevant outputs:

**Generic (Less Effective):**

```yaml
role: "Writer"
```

**Specialized (More Effective):**

```yaml
role: "Technical Blog Writer specializing in explaining complex AI concepts to non-technical audiences"
```

**Specialist Benefits:**

* Clearer understanding of expected output
* More consistent performance
* Better alignment with specific tasks
* Improved ability to make domain-specific judgments

### 3. Balancing Specialization and Versatility

Effective agents strike the right balance between specialization (doing one thing extremely well) and versatility (being adaptable to various situations):

* **Specialize in role, versatile in application**: Create agents with specialized skills that can be applied across multiple contexts
* **Avoid overly narrow definitions**: Ensure agents can handle variations within their domain of expertise
* **Consider the collaborative context**: Design agents whose specializations complement the other agents they'll work with

### 4. Setting Appropriate Expertise Levels

The expertise level you assign to your agent shapes how they approach tasks:

* **Novice agents**: Good for straightforward tasks, brainstorming, or initial drafts
* **Intermediate agents**: Suitable for most standard tasks with reliable execution
* **Expert agents**: Best for complex, specialized tasks requiring depth and nuance
* **World-class agents**: Reserved for critical tasks where exceptional quality is needed

Choose the appropriate expertise level based on task complexity and quality requirements. For most collaborative crews, a mix of expertise levels often works best, with higher expertise assigned to core specialized functions.

## Practical Examples: Before and After

Let's look at some examples of agent definitions before and after applying these best practices:

### Example 1: Content Creation Agent

**Before:**

```yaml
role: "Writer"
goal: "Write good content"
backstory: "You are a writer who creates content for websites."
```

**After:**

```yaml
role: "B2B Technology Content Strategist"
goal: "Create compelling, technically accurate content that explains complex topics in accessible language while driving reader engagement and supporting business objectives"
backstory: "You have spent a decade creating content for leading technology companies, specializing in translating technical concepts for business audiences. You excel at research, interviewing subject matter experts, and structuring information for maximum clarity and impact. You believe that the best B2B content educates first and sells second, building trust through genuine expertise rather than marketing hype."
```

### Example 2: Research Agent

**Before:**

```yaml
role: "Researcher"
goal: "Find information"
backstory: "You are good at finding information online."
```

**After:**

```yaml
role: "Academic Research Specialist in Emerging Technologies"
goal: "Discover and synthesize cutting-edge research, identifying key trends, methodologies, and findings while evaluating the quality and reliability of sources"
backstory: "With a background in both computer science and library science, you've mastered the art of digital research. You've worked with research teams at prestigious universities and know how to navigate academic databases, evaluate research quality, and synthesize findings across disciplines. You're methodical in your approach, always cross-referencing information and tracing claims to primary sources before drawing conclusions."
```

## Crafting Effective Tasks for Your Agents

While agent design is important, task design is critical for successful execution. Here are best practices for designing tasks that set your agents up for success:

### The Anatomy of an Effective Task

A well-designed task has two key components that serve different purposes:

#### Task Description: The Process

The description should focus on what to do and how to do it, including:

* Detailed instructions for execution
* Context and background information
* Scope and constraints
* Process steps to follow

#### Expected Output: The Deliverable

The expected output should define what the final result should look like:

* Format specifications (markdown, JSON, etc.)
* Structure requirements
* Quality criteria
* Examples of good outputs (when possible)

### Task Design Best Practices

#### 1. Single Purpose, Single Output

Tasks perform best when focused on one clear objective:

**Bad Example (Too Broad):**

```yaml
task_description: "Research market trends, analyze the data, and create a visualization."
```

**Good Example (Focused):**

```yaml
# Task 1
research_task:
  description: "Research the top 5 market trends in the AI industry for 2024."
  expected_output: "A markdown list of the 5 trends with supporting evidence."

# Task 2
analysis_task:
  description: "Analyze the identified trends to determine potential business impacts."
  expected_output: "A structured analysis with impact ratings (High/Medium/Low)."

# Task 3
visualization_task:
  description: "Create a visual representation of the analyzed trends."
  expected_output: "A description of a chart showing trends and their impact ratings."
```

#### 2. Be Explicit About Inputs and Outputs

Always clearly specify what inputs the task will use and what the output should look like:

**Example:**

```yaml
analysis_task:
  description: >
    Analyze the customer feedback data from the CSV file.
    Focus on identifying recurring themes related to product usability.
    Consider sentiment and frequency when determining importance.
  expected_output: >
    A markdown report with the following sections:
    1. Executive summary (3-5 bullet points)
    2. Top 3 usability issues with supporting data
    3. Recommendations for improvement
```

#### 3. Include Purpose and Context

Explain why the task matters and how it fits into the larger workflow:

**Example:**

```yaml
competitor_analysis_task:
  description: >
    Analyze our three main competitors' pricing strategies.
    This analysis will inform our upcoming pricing model revision.
    Focus on identifying patterns in how they price premium features
    and how they structure their tiered offerings.
```

#### 4. Use Structured Output Tools

For machine-readable outputs, specify the format clearly:

**Example:**

```yaml
data_extraction_task:
  description: "Extract key metrics from the quarterly report."
  expected_output: "JSON object with the following keys: revenue, growth_rate, customer_acquisition_cost, and retention_rate."
```

## Common Mistakes to Avoid

Based on lessons learned from real-world implementations, here are the most common pitfalls in agent and task design:

### 1. Unclear Task Instructions

**Problem:** Tasks lack sufficient detail, making it difficult for agents to execute effectively.

**Example of Poor Design:**

```yaml
research_task:
  description: "Research AI trends."
  expected_output: "A report on AI trends."
```

**Improved Version:**

```yaml
research_task:
  description: >
    Research the top emerging AI trends for 2024 with a focus on:
    1. Enterprise adoption patterns
    2. Technical breakthroughs in the past 6 months
    3. Regulatory developments affecting implementation

    For each trend, identify key companies, technologies, and potential business impacts.
  expected_output: >
    A comprehensive markdown report with:
    - Executive summary (5 bullet points)
    - 5-7 major trends with supporting evidence
    - For each trend: definition, examples, and business implications
    - References to authoritative sources
```

### 2. "God Tasks" That Try to Do Too Much

**Problem:** Tasks that combine multiple complex operations into one instruction set.

**Example of Poor Design:**

```yaml
comprehensive_task:
  description: "Research market trends, analyze competitor strategies, create a marketing plan, and design a launch timeline."
```

**Improved Version:**
Break this into sequential, focused tasks:

```yaml
# Task 1: Research
market_research_task:
  description: "Research current market trends in the SaaS project management space."
  expected_output: "A markdown summary of key market trends."

# Task 2: Competitive Analysis
competitor_analysis_task:
  description: "Analyze strategies of the top 3 competitors based on the market research."
  expected_output: "A comparison table of competitor strategies."
  context: [market_research_task]

# Continue with additional focused tasks...
```

### 3. Misaligned Description and Expected Output

**Problem:** The task description asks for one thing while the expected output specifies something different.

**Example of Poor Design:**

```yaml
analysis_task:
  description: "Analyze customer feedback to find areas of improvement."
  expected_output: "A marketing plan for the next quarter."
```

**Improved Version:**

```yaml
analysis_task:
  description: "Analyze customer feedback to identify the top 3 areas for product improvement."
  expected_output: "A report listing the 3 priority improvement areas with supporting customer quotes and data points."
```

### 4. Not Understanding the Process Yourself

**Problem:** Asking agents to execute tasks that you yourself don't fully understand.

**Solution:**

1. Try to perform the task manually first
2. Document your process, decision points, and information sources
3. Use this documentation as the basis for your task description

### 5. Premature Use of Hierarchical Structures

**Problem:** Creating unnecessarily complex agent hierarchies where sequential processes would work better.

**Solution:** Start with sequential processes and only move to hierarchical models when the workflow complexity truly requires it.

### 6. Vague or Generic Agent Definitions

**Problem:** Generic agent definitions lead to generic outputs.

**Example of Poor Design:**

```yaml
agent:
  role: "Business Analyst"
  goal: "Analyze business data"
  backstory: "You are good at business analysis."
```

**Improved Version:**

```yaml
agent:
  role: "SaaS Metrics Specialist focusing on growth-stage startups"
  goal: "Identify actionable insights from business data that can directly impact customer retention and revenue growth"
  backstory: "With 10+ years analyzing SaaS business models, you've developed a keen eye for the metrics that truly matter for sustainable growth. You've helped numerous companies identify the leverage points that turned around their business trajectory. You believe in connecting data to specific, actionable recommendations rather than general observations."
```

## Advanced Agent Design Strategies

### Designing for Collaboration

When creating agents that will work together in a crew, consider:

* **Complementary skills**: Design agents with distinct but complementary abilities
* **Handoff points**: Define clear interfaces for how work passes between agents
* **Constructive tension**: Sometimes, creating agents with slightly different perspectives can lead to better outcomes through productive dialogue

For example, a content creation crew might include:

```yaml
# Research Agent
role: "Research Specialist for technical topics"
goal: "Gather comprehensive, accurate information from authoritative sources"
backstory: "You are a meticulous researcher with a background in library science..."

# Writer Agent
role: "Technical Content Writer"
goal: "Transform research into engaging, clear content that educates and informs"
backstory: "You are an experienced writer who excels at explaining complex concepts..."

# Editor Agent
role: "Content Quality Editor"
goal: "Ensure content is accurate, well-structured, and polished while maintaining consistency"
backstory: "With years of experience in publishing, you have a keen eye for detail..."
```

### Creating Specialized Tool Users

Some agents can be designed specifically to leverage certain tools effectively:

```yaml
role: "Data Analysis Specialist"
goal: "Derive meaningful insights from complex datasets through statistical analysis"
backstory: "With a background in data science, you excel at working with structured and unstructured data..."
tools: [PythonREPLTool, DataVisualizationTool, CSVAnalysisTool]
```

### Tailoring Agents to LLM Capabilities

Different LLMs have different strengths. Design your agents with these capabilities in mind:

```yaml
# For complex reasoning tasks
analyst:
  role: "Data Insights Analyst"
  goal: "..."
  backstory: "..."
  llm: openai/gpt-4o

# For creative content
writer:
  role: "Creative Content Writer"
  goal: "..."
  backstory: "..."
  llm: anthropic/claude-3-opus
```

## Testing and Iterating on Agent Design

Agent design is often an iterative process. Here's a practical approach:

1. **Start with a prototype**: Create an initial agent definition
2. **Test with sample tasks**: Evaluate performance on representative tasks
3. **Analyze outputs**: Identify strengths and weaknesses
4. **Refine the definition**: Adjust role, goal, and backstory based on observations
5. **Test in collaboration**: Evaluate how the agent performs in a crew setting

## Conclusion

Crafting effective agents is both an art and a science. By carefully defining roles, goals, and backstories that align with your specific needs, and combining them with well-designed tasks, you can create specialized AI collaborators that produce exceptional results.

Remember that agent and task design is an iterative process. Start with these best practices, observe your agents in action, and refine your approach based on what you learn. And always keep in mind the 80/20 rule - focus most of your effort on creating clear, focused tasks to get the best results from your agents.

<Check>
  Congratulations! You now understand the principles and practices of effective agent design. Apply these techniques to create powerful, specialized agents that work together seamlessly to accomplish complex tasks.
</Check>

## Next Steps

* Experiment with different agent configurations for your specific use case
* Learn about [building your first crew](/en/guides/crews/first-crew) to see how agents work together
* Explore [CrewAI Flows](/en/guides/flows/first-flow) for more advanced orchestration

