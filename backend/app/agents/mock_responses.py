# Pre-generated realistic academic texts for offline demonstration.
# Used when no LLM API keys are provided.

MOCK_RESPONSES = {
    # TOPIC 1: LLM Factuality using RAG
    "llm_rag": {
        "topic": """# Refined Research Titles:
1. *Factual-RAG: Mitigating Hallucinations in Large Language Models via Context-Aware Adaptive Retrieval*
2. *Enhancing Factual Precision of Generative Language Models through Graph-Structured Knowledge Dense Retrieval*
3. *Mitigating LLM Hallucinations: A Dual-Orchestration Framework for Dynamic Reference-Based Generation*

## Problem Statement:
Large Language Models (LLMs) suffer from "hallucinations," generating plausible but factually incorrect assertions. Existing Retrieval-Augmented Generation (RAG) approaches frequently inject noisy, out-of-context snippets, causing the generator to ignore retrieved knowledge or synthesize contradictory assertions. There is a critical lack of mechanisms to verify claims in real-time during generation.

## Key Objectives:
1. Design an adaptive retriever that dynamically queries knowledge bases based on statement confidence.
2. Implement a dense passage reranker utilizing semantic graph relationships to filter noisy text fragments.
3. Formulate a real-time self-correction generator that cross-references emerging drafts against retrieval context.
4. Benchmark the framework against traditional RAG pipelines on TruthfulQA and MMLU datasets.""",
        
        "literature": """# Literature Synthesis: LLM Factuality & RAG
A synthesis of recent literature reveals two main areas of active development and associated limitations:

## Theme 1: Dense Retrieval Architectures
Recent works like Lewis et al. (2020) established that dense embeddings retrieved via bi-encoders substantially improve context relevance compared to lexical TF-IDF searches. However, Karpukhin et al. (2020) showed that dense retrievers struggle when queries contain complex negation or temporal constraints, leading to irrelevant context injections.

## Theme 2: Hallucination Mitigation Techniques
Shuster et al. (2021) demonstrated that increasing retrieval document counts reduces hallucination rates. Conversely, Izacard et al. (2022) highlighted that feeding too much context leads to the "lost in the middle" phenomenon, where LLMs fail to attend to information placed in the middle of long prompts.

## IEEE Citation Mapping:
[1] P. Lewis et al., "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks," NeurIPS, 2020.
[2] V. Karpukhin et al., "Dense Passage Retrieval for Open-Domain Question Answering," EMNLP, 2020.
[3] K. Shuster et al., "Retrieval Augmentation Reduces Hallucination in Conversation," arXiv:2104.07567, 2021.""",
        
        "gap": """# Research Gap Analysis
Based on a comparison of the objectives and existing literature, the following gap is identified:

## The Open Research Gap
Current RAG frameworks are passive: they query a database *once* based on the initial prompt, and feed the results straight to the LLM. If the retrieved passage is ambiguous or contains irrelevant noise, the model generates factual errors. There is no **feedback loop** that allows the LLM to recursively check if its generated sentences align with the source text before outputting them.

## Novelty & Contribution
We propose a **Dynamic Verification Loop (DVL)**. During generation, the model token-by-token evaluates its assertion confidence. For any low-confidence segment, it queries the database adaptively. This active-retrieval loop reduces context noise and achieves a 25% hallucination reduction compared to static RAG pipelines.""",
        
        "methodology": """# Methodology Design
We present the architecture of **Factual-RAG**, featuring dynamic confidence-based query triggering.

## 1. System Architecture
The framework consists of:
- **Confidence Monitor**: Evaluates token probability $p(x_t | x_{<t})$. If $p(x_t) < \tau$ (threshold), retrieval is triggered.
- **Bi-Encoder Retriever**: Converts generated buffer into embedding vector $q$.
- **Verifier Agent**: Computes semantic entailment between draft sentence and retrieved document.

## 2. Formulations & Equations
The generation probability of a token $y_t$ given context $x$ and retrieved document $d$ is represented as:
$$P(y_t | y_{<t}, x) = \lambda_t P_{LM}(y_t | y_{<t}, x) + (1 - \lambda_t) P_{RAG}(y_t | y_{<t}, x, d)$$
Where $\lambda_t$ is the confidence coefficient computed from the entropy of the token distribution:
$$\lambda_t = \max\left(0, 1 - \frac{H(Y_t)}{\log |V|}\right)$$

## 3. Baselines & Datasets
- **Datasets**: TruthfulQA, FeVer (Fact Extraction and VERification).
- **Baselines**: Standard Llama-3-8B, LangChain Conversational RAG, and Self-RAG.""",
        
        "Abstract": "Large Language Models (LLMs) frequently generate factually incorrect claims, a phenomenon known as hallucination. While Retrieval-Augmented Generation (RAG) mitigates this issue, static retrieval schemes inject irrelevant text, degrading output quality. In this paper, we present Factual-RAG, an active, confidence-guided retrieval framework that dynamically queries external knowledge bases when token generation probabilities drop below an adaptive threshold. Our methodology implements a real-time semantic verification loop to ensure generated sentences are supported by retrieved sources. Evaluated on the TruthfulQA dataset, Factual-RAG improves factual accuracy by 22% over standard RAG baselines while maintaining computational efficiency.",
        
        "Introduction": "In recent years, Large Language Models (LLMs) have achieved remarkable success across diverse natural language processing tasks. However, their deployment in critical domains like healthcare and legal analysis is hindered by their tendency to hallucinate. Retrieval-Augmented Generation (RAG) has emerged as a promising solution. As established by Lewis et al. [1], injecting external source passages into the generation prompt allows models to anchor their answers in verified data. Despite these advantages, standard RAG pipelines are static, querying documents only once at the start. When the generated text drifts or requires fine-grained citations, static context becomes obsolete. This paper introduces Factual-RAG, a dynamic retrieval model that addresses this limitation.",
        
        "Literature Review": "Retrieval augmentation has evolved from simple keyword search to dense vector representations. Karpukhin et al. [2] introduced Dense Passage Retrieval (DPR), demonstrating that dual-encoder architectures retrieve semantic contexts far better than BM25. However, Shuster et al. [3] observed that when long documents are retrieved, LLMs suffer from attention fatigue, ignoring middle portions. This research builds upon active retrieval strategies. Instead of retrieving pre-generation, our framework monitors LLM generation confidence continuously, querying only when token entropy increases.",
        
        "Methodology": "The Factual-RAG architecture comprises three main components: a confidence monitor, a dense vector index, and a claim verifier. We define the retrieval trigger based on token probability distribution entropy. For each step $t$, the generator computes entropy $H(Y_t)$. When $H(Y_t) > \theta$, a query is constructed from the last generated sentence. The claim verifier calculates semantic entailment between the generated draft and retrieved passages. If an inconsistency is detected, a correction prompt forces the LLM to rewrite the sentence, anchoring it to the source.",
        
        "Results & Discussion": "We evaluated Factual-RAG using the TruthfulQA dataset. Compared to a base Llama-3 model (which scored 42% factual accuracy) and a static RAG baseline (which scored 68%), Factual-RAG achieved 84% factual accuracy. We observed that dynamic retrieval significantly reduces the insertion of unsupported claims. In terms of latency, Factual-RAG reduces total token generation overhead by 15% because retrieval is only triggered when necessary rather than for every single block.",
        
        "Conclusion": "In this paper, we introduced Factual-RAG, a framework that dynamically integrates dense retrieval with LLM generation via a real-time confidence verification loop. By actively monitoring generation entropy and enforcing factual alignment, we significantly reduce hallucinations. Future work will investigate expanding this dynamic verification loop to long-form multi-page thesis drafting."
    },
    # TOPIC 2: Autonomous UAV Navigation
    "uav_nav": {
        "topic": """# Refined Research Titles:
1. *Robust Visual-Inertial Odometry for Autonomous UAV Navigation in GPS-Denied Corridors*
2. *Dynamic LiDAR-Visual Fusion for Real-Time Quadrotor Localization and Obstacle Avoidance*
3. *VIO-SLAM: Edge-Compute Kinematic Estimation for Micro Aerial Vehicles in GNSS-Deprived Scenarios*

## Problem Statement:
Micro Aerial Vehicles (MAVs) operating in indoor or GNSS-denied environments must rely on onboard sensors for localization and navigation. Standard Visual-Inertial Odometry (VIO) suffers from cumulative drift and scale drift, particularly during high-acceleration maneuvers or in low-texture dark environments.

## Key Objectives:
1. Develop an error-state Kalman filter fusing monocular camera frames with high-rate IMU readings.
2. Implement real-time keyframe depth restoration using a lightweight self-supervised depth estimator.
3. Formulate a drift correction loop using local structural constraints (planes, lines) extracted from corridors.
4. Verify onboard execution latency under 15ms on an NVIDIA Jetson Orin Nano compute block.""",
        
        "literature": """# Literature Synthesis: UAV VIO Navigation
Key research findings from uploaded literature:

## Theme 1: Visual Drift Mitigation
Forster et al. (2016) introduced IMU preintegration, allowing efficient optimization-based VIO. However, visual drift accumulates rapidly in dark corridors due to lack of trackable features.

## Theme 2: Multi-Sensor Fusion
Qin et al. (2018) developed VINS-Mono, demonstrating robust initialization and online sensor calibration. Yet, scale observability remains weak during uniform motion, causing severe landing errors.

## IEEE Citation Mapping:
[1] C. Forster et al., "IMU Preintegration on Manifold for Efficient Visual-Inertial Navigation," IEEE Trans. Robotics, 2016.
[2] T. Qin et al., "VINS-Mono: A Robust and Versatile Monocular Visual-Inertial State Estimator," IEEE Trans. Robotics, 2018.""",
        
        "gap": """# Research Gap Analysis
Comparison of current solutions and objectives highlights:

## The Open Research Gap
Existing monocular VIO algorithms assume stable lighting and sufficient texture. When a UAV transitions between bright rooms and dark hallways, visual tracking fails entirely, causing IMU integration drift to crash the aircraft. There is a lack of algorithms utilizing structural hallway geometry (parallel walls, ceiling lines) to constrain IMU drift when visual features are lost.

## Novelty & Contribution
Our work integrates **Geometric Line Constraints (GLC)** directly into the measurement model. By tracking structural borders of hallways, localization drift is capped even when visual keypoints are completely absent.""",
        
        "methodology": """# Methodology Design
Our proposed Visual-Inertial Odometry integrates IMU preintegration with geometric line filtering.

## 1. Estimation Pipeline
- **Front-end**: Lucas-Kanade tracker for point features, combined with LSD line extractor.
- **State Estimation**: Error-State Extended Kalman Filter (ES-EKF) updating at 200 Hz.
- **Geometric Loop**: Corrects vertical drift by assuming parallel hallway structure.

## 2. Formulations & Equations
The IMU error state vector $\delta \mathbf{x}$ is defined as:
$$\delta \mathbf{x} = [\delta \mathbf{p}^T, \delta \mathbf{v}^T, \delta \boldsymbol{\theta}^T, \delta \mathbf{b}_a^T, \delta \mathbf{b}_g^T]^T$$
Where $\mathbf{p}, \mathbf{v}, \boldsymbol{\theta}$ represent position, velocity, and orientation errors, and $\mathbf{b}_a, \mathbf{b}_g$ represent IMU sensor biases.
The line measurement update uses the distance residual to wall lines:
$$r_l = \mathbf{n}^T \mathbf{p}_k - d = 0$$

## 3. Baselines & Evaluation
- **Datasets**: EuRoC MAV, custom corridor dataset.
- **Baselines**: VINS-Mono, ORB-SLAM3.""",
        
        "Abstract": "Autonomous navigation of Micro Aerial Vehicles (MAVs) in GNSS-deprived areas requires highly robust localization. Visual-Inertial Odometry (VIO) is commonly used, but suffers from severe drift under lighting changes or texture-free environments. This paper presents a structural-constrained VIO pipeline that integrates parallel line features from hallways into an Error-State Kalman Filter (ES-EKF). Our algorithm dynamically switches to geometric corridor constraints when point-feature tracking degrades. Tested on physical quadrotor hardware, our methodology limits horizontal localization drift to less than 0.12 meters over a 100-meter flight path without external beacons.",
        
        "Introduction": "Unmanned Aerial Vehicles (UAVs) are increasingly deployed in search and rescue operations inside structural ruins and underground tunnels. In these GNSS-denied settings, internal localization is crucial. As proposed by Forster et al. [1], IMU preintegration provides tight coupling of high-rate IMU and camera frames, forming the basis of modern VIO. However, visual tracking failures caused by rapid rotations or low texture lead to unbounded IMU drift. This paper addresses visual degradation by leveraging hallway geometry.",
        
        "Literature Review": "Existing approaches in monocular localization focus on point-feature tracking. Qin et al. [2] built VINS-Mono, a state-of-the-art optimization framework that calibrates camera-IMU extrinsic parameters online. While highly accurate in feature-rich environments, VINS-Mono fails when facing blank white walls. Recent attempts to integrate line features improve reliability, but suffer from high computational complexity, making edge execution on lightweight drones infeasible.",
        
        "Methodology": "Our system integrates monocular visual data with a 6-axis IMU using an Error-State Extended Kalman Filter (ES-EKF). We define the state vector to track MAV positions and sensor biases. When a corridor structure is detected via Hough transform, we extract parallel lines representing the intersection of walls and ceilings. These lines act as geometric rails, constraining the lateral and vertical drift variables in the EKF measurement update equations.",
        
        "Results & Discussion": "We conducted simulations using the EuRoC MAV datasets and physical trials in a 120-meter hallway. Compared to VINS-Mono, which drifted by 1.8 meters, our geometric VIO restricted drift to 0.11 meters. The processor usage on our onboard Jetson compute module remained below 22%, verifying real-time capability under 12ms per frame.",
        
        "Conclusion": "This paper demonstrated a novel geometric-constrained VIO framework for autonomous UAV flight in corridors. By incorporating structural lines in the Kalman measurement model, we maintain localization during visual feature loss. Future work will extend this framework to 3D mapping and automated path planning."
    }
}
