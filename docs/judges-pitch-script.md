# YardWatch Judge Pitch Script

This version adds the missing commercial story, explicitly mentions insurance loss estimation, and explains network liveliness in plain language.

## Revised 3-Minute Script

### 0:00-0:25 Problem

"After a hurricane or flood, the problem is usually not a lack of imagery. The problem is turning that imagery into fast decisions. Teams may have hundreds of damaged properties and infrastructure to review, but adjusters, emergency crews, and response leaders need to know what matters first. If that triage is manual, valuable hours are lost."

### 0:25-0:50 What YardWatch Does

"YardWatch converts post-event imagery into a field-ready response queue. We detect building-level damage, rank severity, enrich detections with address information, and generate a prioritized list of properties that need attention first. For insurers, we also produce an early damage estimate, so the platform supports both triage and claim response, not just detection."

### 0:50-1:05 Why It Matters

"For Jamaicans, that means faster recovery after storms, faster insurance response for damaged homes, and faster identification of communities and facilities that need urgent attention. For first responders and emergency teams anywhere, it means less time lost on manual review and more time spent getting help to the right places. YardWatch is built to turn disaster data into action early enough to make a real difference."

### 1:05-1:20 Demo Setup

"On this screen, we are using one Melissa post-event tile. In this single dataset, YardWatch detected 508 building footprints. But the user does not need to inspect all 508 manually. The system has already prioritized 67 high-urgency cases, including 9 critical ones."

### 1:20-1:40 Demo Point 1

Action: Point to the stats bar and sidebar.

"The dashboard answers the first operational questions immediately. At the top, we can see total detections, the priority count, and the critical count. In the sidebar, we see the ranked queue, ordered so the most urgent inspections rise to the top."

### 1:40-2:05 Demo Point 2

Action: Click one polygon or one item in the list.

"When I select a footprint, YardWatch shows more than a shape on a map. It shows the address when one is available, the severity level, the recommended action, and a damage estimate for insurance triage. That estimate helps insurers decide which claims likely need faster human review. And if there is no reliable address match, the platform clearly says 'No Information found' instead of pretending certainty."

### 2:05-2:25 Demo Point 3

Action: Click Start Briefing and let it advance through a few homes.

"Now I will start the briefing. YardWatch walks through the top 10 homes by likely damage, flies to each footprint, and updates the queue as it goes. Instead of manually panning, zooming, and sorting, the reviewer gets a guided triage tour of the homes most likely to need urgent inspection."

### 2:25-2:50 Network Liveliness

"We are also adding a network liveliness layer. In simple terms, this works like a digital heartbeat. If phones, WiFi points, or facility hardware at a location normally check in and then suddenly go silent, that is a strong signal that the site may have lost power or connectivity. In this demo we simulate those heartbeat signals through phones. Long term, the same approach can use WiFi hardware and fixed probes at critical facilities to help governments and utilities spot likely outages faster."

### 2:50-3:00 Business Model Close

"We make money in three ways: recurring monitoring subscriptions, paid disaster activations, and premium add-ons like API delivery, analyst briefing packs, and address enrichment. That gives YardWatch a repeatable software business model while solving a real response problem for governments, insurers, and utilities."

## PRIME Framing

Use this section when the judges want the idea explained against `Problem`, `Real world Impact`, `Implementation`, `Messaging`, and `Execution`.

### Problem

Core answer:

"After a disaster, the bottleneck is not collecting imagery. The bottleneck is deciding what to inspect first. Teams are forced to manually scan hundreds of damaged locations, which slows relief, claim handling, and infrastructure response during the most time-sensitive window."

What to emphasize:

- Too many damaged properties, too little time
- Manual triage slows adjusters, emergency teams, and utilities
- Delayed prioritization means delayed recovery

### Real World Impact

Core answer:

"YardWatch reduces the time between image capture and action. Instead of reviewing every structure manually, response teams get a prioritized queue of the locations most likely to need urgent attention. That means faster disaster recovery, faster claim triage, and faster restoration planning."

What to emphasize:

- Governments can send crews to the hardest-hit communities faster
- Insurers can route adjusters to the most severe claims first
- Utilities can identify likely outage zones and restoration priorities sooner
- The product saves time exactly when time matters most

### Implementation

Core answer:

"Today, YardWatch already ingests post-event imagery, detects building-level damage, ranks severity, enriches detections with address data, and presents the results in a prioritized dashboard with guided briefing. We also generate an early insurance damage estimate for claim triage. Next, we are expanding into network liveliness so loss of device or WiFi check-ins can signal likely outages in affected areas."

Implemented now:

- Building-level damage detection
- Severity ranking
- Address enrichment
- Prioritized triage queue
- Guided top-10 briefing flow
- Early insurance damage estimate

In the pipeline:

- Network liveliness monitoring
- WiFi hardware and fixed-probe integration
- Stronger outage detection for governments and utilities
- Combined imagery + connectivity view for critical infrastructure response

### Messaging

Core answer:

"The message is that YardWatch does not just produce data. It produces operational decisions. For investors, this is a repeatable disaster-response software business with subscription and event-based revenue. For clients, this is a practical tool that helps them act faster, reduce manual review, and use field teams more efficiently."

Investor message:

- Repeatable SaaS plus event activation model
- Multi-sector demand across government, insurance, and utilities
- Expands from disaster imagery into broader resilience intelligence

Client message:

- Faster prioritization
- Less manual map review
- Better use of limited staff and field resources
- Clear outputs, not raw analytics

### Execution

Core answer:

"We use geospatial AI and operational workflow design together. The system processes imagery, scores building damage, enriches results with addresses, estimates likely loss, and presents a ranked response queue. The dashboard then turns that analysis into a guided workflow that helps decision-makers move from detection to dispatch."

What to emphasize:

- AI is used to detect and rank damage
- Geospatial enrichment adds address-level context
- Insurance logic adds estimated loss for claim triage
- Workflow design turns model output into a usable response tool
- Future liveliness signals extend the same system into outage detection

## Expanded Judge Answers

Use these when you need a fuller, more persuasive answer instead of the short version.

### Problem

"The problem we are solving is decision delay after a disaster. Imagery exists, but raw imagery does not tell an insurer which claim to inspect first, does not tell a disaster team which area needs urgent response first, and does not tell a utility where the most likely outage clusters are. Today, a lot of that work is still manual. People pan across maps, compare structures one by one, and try to build priority lists by hand. That costs time during the exact window when fast action matters most. YardWatch exists to remove that bottleneck and turn raw post-event data into a clear order of action."

### Real World Impact

"The real-world impact is speed. If we can reduce the time it takes to identify the most affected homes, facilities, or corridors, then recovery starts earlier. Governments can send assessment teams into the hardest-hit communities sooner. Insurers can route adjusters toward the most severe claims instead of working blindly through a queue. Utilities can focus restoration crews on the areas most likely to be down. The value is not just that we detect damage. The value is that we shorten the gap between evidence and response, which helps people get help, get claims processed, and get critical services restored faster."

### Implementation

"What we have implemented today is the core triage engine. We ingest post-event imagery, identify building footprints, classify likely damage severity, enrich detections with address information, and present the results in a prioritized dashboard. We also added a guided briefing flow so the user does not need to manually pan and inspect every case. On top of that, we produce an early insurance-oriented damage estimate to help triage claims. What is in the pipeline is the next layer of situational awareness: network liveliness. That feature will use the presence or absence of device and WiFi activity as another signal to identify likely outages and service disruption around critical locations."

### Messaging

"The message we want investors and customers to hear is simple: YardWatch turns disaster data into faster operational decisions. For investors, that means this is not just an imagery demo. It is a repeatable software and response platform with clear commercial use cases in government, insurance, and utilities. For customers, the message is even simpler: YardWatch helps your team stop wasting time on manual review and start acting on the locations that matter most. We are selling clarity, speed, and prioritization under pressure."

### Execution

"Our execution combines AI, geospatial processing, and workflow design. The technology detects and scores damage, but the real execution strength is that we do not stop at model output. We turn those outputs into an operational queue, a map workflow, and briefing tools that a real team can use under time pressure. That is important because clients do not buy analytics for analytics' sake. They buy an outcome: fewer manual hours, faster dispatch, and better prioritization."

## Damage Estimate Explanation

This is the plain-English version to use when judges ask how the estimate works.

### Short version

"We treat it as an early triage estimate, not a final claim settlement number. We estimate the building size from its footprint, apply a local rebuilding cost, and then adjust that value based on how severe the visible damage appears in and around the structure. That gives us a practical first-pass estimate that helps insurers decide which properties likely need urgent review."

### Slightly longer version

"In simple terms, we start by estimating how large the building is from the shape we detect on the image. Then we apply an estimated rebuilding cost per square foot based on local market assumptions. After that, we adjust the result using the damage signals the model sees at the building itself and in the immediate area around it. The output is not meant to replace an adjuster or a final claim valuation. It is meant to help triage, so the insurer can identify which properties likely represent larger losses and should be inspected first."

### If judges ask why this is useful

"That estimate matters because insurers do not just need to know whether a roof may be damaged. They need to know where the likely higher-severity and higher-value claims are so they can route limited adjusters more intelligently. Even a simplified early estimate is valuable if it helps the claims team prioritize correctly in the first hours after an event."

### Safe clarification

"We would always present it as an early operational estimate for prioritization, not as the final number used to settle a claim."

## Value Proposition

### Core value proposition

"YardWatch helps organizations move from raw disaster data to prioritized action in minutes. Instead of spending hours reviewing maps and structures manually, teams get a ranked list of the locations most likely to need urgent attention."

### Why customers care

- Governments care because faster prioritization means faster field assessment and relief deployment.
- Insurers care because faster triage means adjusters spend time on the claims that matter most first.
- Utilities care because faster outage signals mean restoration crews can be sent where service loss is most likely.

### Why this is commercially strong

"The same core engine serves multiple buyers with the same pain point: too much uncertainty, not enough time. That gives YardWatch a broader market than a single-purpose disaster map. We can sell recurring monitoring, event activation, and premium workflows into three sectors that all need faster decisions under pressure."

## How To Sell The Story

Use this structure when telling the problem-value story:

### 1. Start with urgency

"After a hurricane or flood, every hour matters. But teams are often forced into manual review at the exact moment when they need speed."

### 2. Show the operational pain

"Hundreds of properties may be affected, but response teams do not know which 10, 50, or 100 deserve immediate attention. That uncertainty delays recovery."

### 3. Position YardWatch as the bridge

"YardWatch bridges the gap between imagery and action. We take a large volume of raw detections and turn it into a prioritized operational queue."

### 4. Tie it to concrete outcomes

"That means relief teams can move sooner, insurers can triage claims sooner, and utilities can identify likely outages sooner."

### 5. End on the broader value

"So the product is not just about seeing disaster damage. It is about helping communities and institutions recover faster."

## Better Q&A Answers

- `How do you estimate damage?`
  "We estimate the building footprint size, apply a local rebuild-cost assumption, and adjust that using the severity of visible damage in and around the structure. It is an early triage estimate, not a final settlement figure."
- `What is the real value here?`
  "The value is faster prioritization. We reduce the time between imagery capture and operational action."
- `Why will customers pay for this?`
  "Because they are not paying for imagery alone. They are paying to reduce manual review, deploy field teams faster, and make higher-pressure decisions with more clarity."
- `Why is this better than a map with overlays?`
  "A map with overlays still leaves the user to do the prioritization work manually. YardWatch turns the map into a ranked workflow."
- `Why is the network feature important?`
  "Because damage is only part of the picture. If connectivity suddenly drops at a location, that is a useful additional signal of likely outage or infrastructure disruption."

## Addendum: Damage Estimate Grounding

Use this only if a judge asks where the estimate comes from or how it is grounded.

### Judge-friendly answer

"Our damage estimate is a simplified triage estimate grounded in local cost references, not a final claims-adjustment number. We estimate the building footprint area from the detected polygon, apply a Jamaica-normalized rebuilding baseline, add a modest surge and logistics factor that reflects post-disaster conditions, and then scale that by how severe the visible damage appears on and around the structure."

### More specific explanation

"In the current demo, the estimate starts with the footprint area of the selected building. We then apply a Jamaica rebuild baseline of about `$185 USD per square foot`, plus an `8%` surge and logistics factor to reflect the reality that rebuilding after a disaster is usually more expensive than normal conditions. After that, we apply a weighted damage signal using the damage percentages at the structure itself and in the surrounding area, with a severity floor so severe detections are not understated. That gives us a first-pass loss estimate for triage."

### Why this is credible

"We grounded that baseline using Jamaica-relevant construction and market references, including `BCQS Jamaica`, `Jamaica Homes`, and the `Bank of Jamaica` for currency context. So even though the estimate is simplified for demo purposes, it is anchored to real local cost references rather than an arbitrary placeholder number."

### Safe clarification for judges

"We would position this as an operational estimate for prioritization. A final claim value would still depend on an adjuster, policy terms, and on-the-ground verification."

### If judges ask for the logic in one sentence

"We estimate size, apply a local rebuild cost, add post-disaster surge, and then scale the number based on how severe the visible damage appears."

## Addendum: How We Built The Classification Pipeline

Use this if judges ask how the damage classification pipeline was actually developed.

### Judge-friendly answer

"We built the current classifier as a conservative first-pass pipeline around one post-event Melissa imagery tile. We manually labeled building-related areas, validated those labels, fine-tuned an existing building-damage assessment workflow, and then merged the model output with building footprints so the results could be used at the property level instead of just as raw pixels."

### Plain-English breakdown

"In simple terms, we started with post-event imagery from the Melissa dataset. We created labeled examples that told the model what was background, what was a building, and what was a damaged building. We then ran a validation step to make sure the labels were structured correctly before training. After that, we fine-tuned a building-damage assessment pipeline, ran inference on the tile, and overlaid the predictions onto building footprints. That gave us per-building damage signals instead of just a heatmap. From there, we calculated building-level damage percentages and translated them into severity bands like critical, high, medium, and low."

### Slightly more technical but still judge-safe

"The workflow in the repo follows a clear sequence: validate labels, create masks, fine-tune the model, run inference, download building footprints, and merge the predictions with those footprints. The current labels use three classes: `Background`, `Building`, and `Damaged Building`. Once the raster predictions are merged with the footprints, we compute damage percentages at the building itself and in the nearby context, and then rank detections into a triage queue."

### Why this matters

"That pipeline matters because most end users cannot act on raw model output alone. By converting imagery into building-level scores and a ranked list, we make the output operational for insurers, disaster agencies, and utilities."

### One-sentence version

"We trained a first-pass damage model on labeled Melissa imagery, mapped the results to building footprints, and turned those outputs into building-level severity rankings."

## Addendum: How The Classification Pipeline Improves In Production

Use this if judges ask what would make the current pipeline stronger outside the demo.

### Judge-friendly answer

"In production, the biggest improvement is not one single model change. It is better data, better calibration, and stronger feedback loops. We would expand the training set across more storms, building types, and geographies, validate against field or claims outcomes, and continuously retrain so the model improves as more disaster events are processed."

### Practical production improvements

- Increase the labeled dataset beyond a single tile so the model sees more roof types, damage patterns, terrain, and weather conditions.
- Add more events and more geographies so the classifier generalizes beyond one storm or one local context.
- Use stronger ground-truth feedback from field inspections, adjuster outcomes, or utility restoration reports to calibrate the model.
- Add confidence scoring and QA review so uncertain detections can be flagged instead of treated as equally reliable.
- Introduce a human-in-the-loop review path for the highest-value or most ambiguous cases.
- Improve temporal analysis with better pre-event and post-event comparisons where imagery is available.
- Tune severity thresholds using production outcomes so the priority queue better matches real-world urgency.

### How to explain it simply

"The demo proves the workflow. Production makes it more reliable by feeding the system more examples, more validation, and more real-world feedback."

### Safe clarification

"We would not present the current version as the final state of the model. We would present it as a strong operational prototype whose accuracy and reliability would improve with broader labeled data and continuous feedback from real deployments."

### One-sentence version

"Production improvement comes from more labeled disaster data, stronger validation against real outcomes, and continuous retraining so the priority queue gets smarter over time."

## PRIME One-Liners

If you need very short answers during Q&A, use these:

- `Problem:` "Disaster teams lose critical hours because imagery still has to be manually reviewed and prioritized."
- `Real world Impact:` "We cut the time from imagery to action, which helps recovery teams, insurers, and utilities respond faster."
- `Implementation:` "We already do damage detection, prioritization, address enrichment, guided briefing, and early insurance loss estimates; next we are adding network liveliness for outage detection."
- `Messaging:` "YardWatch turns raw disaster data into decisions, and that creates value for both investors and frontline operators."
- `Execution:` "We combine geospatial AI, address enrichment, insurance logic, and workflow automation to move teams from map review to action."

## Short Slide Tweaks

### Market Opportunity

Use this line:

"Our business model is subscription plus surge response: monthly monitoring for governments, insurers, and utilities, plus per-event activation when disasters happen."

Optional supporting line:

"Insurance starts as portfolio monitoring and expands into CAT claim triage. Utilities and governments use the same platform for facility prioritization and outage response."

### Core MVP Features

Add:

- Building-level damage detection
- Prioritized triage queue
- Address enrichment
- Early insurance damage estimate
- Guided briefing workflow

### Future Roadmap

Add:

- Network liveliness monitoring for likely outage detection
- Fixed-probe and WiFi hardware integrations
- Combined imagery + outage view for critical infrastructure response

## One-Sentence Revenue Answer

"We sell YardWatch as a recurring monitoring platform with paid disaster activations, then expand revenue through API delivery, analyst briefing packs, and premium workflows for insurance and utility response."
