export type LegalBlock =
  | { type: "h2" | "h3" | "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "paypal"; buttonId: string; label: string }
  | { type: "linkPara"; lead: string; linkText: string; href: string; trail?: string };

export type LegalPage = {
  slug: string;
  title: string;
  description: string;
  blocks: LegalBlock[];
};

/**
 * Club policy pages, restored verbatim from the live Kingston Jiu Jitsu
 * WordPress site (Privacy Policy, Child Protection Policy, Terms & Conditions).
 */
const legalPagesRaw: LegalPage[] = [
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    description:
      "How Kingston Jiu Jitsu collects, uses, stores and shares personal information.",
    blocks: [
      { type: "p", text: "Last updated: 14 September 2026" },
      { type: "h2", text: "1. Who We Are" },
      {
        type: "p",
        text: "Kingston Jiu Jitsu is operated by Kingston Jiu Jitsu Ltd (company number 11578178).",
      },
      {
        type: "p",
        text: "For the purposes of UK data protection law, Kingston Jiu Jitsu Ltd is the controller of the personal information described in this Privacy Policy.",
      },
      {
        type: "p",
        text: "This Privacy Policy explains how and why we collect, use, store and share personal information when you use our website, contact us, train with us, become a member or make a purchase from us.",
      },
      { type: "h2", text: "2. Information We Collect" },
      {
        type: "p",
        text: "We may collect the following types of personal information.",
      },
      { type: "h3", text: "Contact and Membership Information" },
      {
        type: "p",
        text: "When you contact us, book a trial, register for a class or become a member, we may collect information such as:",
      },
      {
        type: "ul",
        items: [
          "your name;",
          "email address;",
          "telephone number;",
          "age or date of birth where relevant;",
          "membership or training information;",
          "parent or guardian details for junior members; and",
          "information you provide when communicating with us.",
        ],
      },
      { type: "h3", text: "Order and Purchase Information" },
      {
        type: "p",
        text: "When you make a purchase from us, we may collect:",
      },
      {
        type: "ul",
        items: [
          "your name;",
          "email address;",
          "telephone number where provided or required;",
          "billing or delivery information where required;",
          "products, courses, seminars, competitions or other services purchased;",
          "product variants and quantities;",
          "order value;",
          "delivery or collection method;",
          "payment status;",
          "transaction references; and",
          "information relating to returns or refunds.",
        ],
      },
      {
        type: "p",
        text: "We do not store your full payment card details. Online payments are processed by our payment provider.",
      },
      { type: "h3", text: "Website and Technical Information" },
      {
        type: "p",
        text: "When you use our website, we may collect technical information such as:",
      },
      {
        type: "ul",
        items: [
          "IP address;",
          "browser and device information;",
          "pages visited;",
          "referring website;",
          "approximate location derived from technical information; and",
          "information collected through cookies or similar technologies.",
        ],
      },
      {
        type: "p",
        text: "Where required, non-essential cookies and analytics technologies are used only in accordance with your cookie choices.",
      },
      { type: "h2", text: "3. How We Use Your Information" },
      {
        type: "p",
        text: "We may use personal information to:",
      },
      {
        type: "ul",
        items: [
          "respond to enquiries;",
          "arrange trials and class registrations;",
          "administer memberships;",
          "communicate with members;",
          "operate and improve our website and services;",
          "process and administer purchases and payments;",
          "arrange delivery or collection of orders;",
          "send order confirmations and other transactional communications;",
          "manage returns, refunds and purchase enquiries;",
          "administer courses, seminars, competitions and other activities;",
          "maintain appropriate financial and transaction records;",
          "protect the security and integrity of our website and systems;",
          "understand how our website is used where analytics are enabled; and",
          "comply with our legal and regulatory obligations.",
        ],
      },
      {
        type: "p",
        text: "We will not use information collected for an order to send unrelated direct marketing solely because you have made a purchase.",
      },
      { type: "h2", text: "4. Our Lawful Bases for Processing" },
      {
        type: "p",
        text: "Under UK data protection law, we must have a lawful basis for processing personal information.",
      },
      {
        type: "p",
        text: "Depending on the circumstances, we may process your information because:",
      },
      { type: "h3", text: "Contract" },
      {
        type: "p",
        text: "Processing is necessary to enter into or perform a contract with you, for example to administer a membership, process an order, provide a course or seminar place, or arrange delivery or collection.",
      },
      { type: "h3", text: "Legitimate Interests" },
      {
        type: "p",
        text: "We may process information where necessary for our legitimate interests or those of another person, provided those interests are not overridden by your rights and interests.",
      },
      {
        type: "p",
        text: "This may include operating and securing our website, responding to enquiries, administering the club and improving our services.",
      },
      { type: "h3", text: "Legal Obligation" },
      {
        type: "p",
        text: "We may process or retain information where necessary to comply with legal, tax, accounting or regulatory requirements.",
      },
      { type: "h3", text: "Consent" },
      {
        type: "p",
        text: "Where consent is required, for example for certain marketing communications or non-essential cookies, we will ask for it. You can withdraw your consent at any time.",
      },
      { type: "h2", text: "5. Payments" },
      {
        type: "p",
        text: "Online payments may be processed by Mollie or another payment provider identified to you at checkout.",
      },
      {
        type: "p",
        text: "Payment information is transmitted securely to the payment provider. Kingston Jiu Jitsu does not store your full payment card number or card security code.",
      },
      {
        type: "p",
        text: "We may retain information associated with the transaction, such as the order number, amount, payment status and payment-provider transaction reference.",
      },
      {
        type: "p",
        text: "The payment provider may process personal information in accordance with its own legal obligations and privacy information.",
      },
      { type: "h2", text: "6. Service Providers and Sharing Your Information" },
      { type: "p", text: "We do not sell your personal information." },
      {
        type: "p",
        text: "We use trusted third-party service providers to help us operate Kingston Jiu Jitsu and our website. Depending on the service being used, these may include:",
      },
      {
        type: "ul",
        items: [
          "Mollie for online payment processing;",
          "Resend for transactional emails;",
          "Vercel for website hosting and application infrastructure;",
          "Supabase for database, authentication and application services;",
          "Google Analytics for website analytics where enabled;",
          "membership and Direct Debit service providers used to administer club memberships and payments; and",
          "other professional or technical service providers where reasonably necessary.",
        ],
      },
      {
        type: "p",
        text: "These providers may process personal information on our behalf or, where applicable, as independent controllers subject to their own legal obligations.",
      },
      {
        type: "p",
        text: "We may also disclose personal information where required by law, to establish or defend legal claims, or where reasonably necessary to protect the rights, property or safety of Kingston Jiu Jitsu, our members, customers or others.",
      },
      { type: "h2", text: "7. Order Records and Retention" },
      {
        type: "p",
        text: "We retain personal information only for as long as reasonably necessary for the purpose for which it was collected and to meet applicable legal, accounting and regulatory requirements.",
      },
      {
        type: "p",
        text: "Order and transaction records may generally be retained for up to six years after the end of the relevant accounting period, or for longer where required by law or reasonably necessary to establish, exercise or defend legal claims.",
      },
      {
        type: "p",
        text: "Membership, enquiry and other records are retained for periods appropriate to their purpose and our legal obligations.",
      },
      {
        type: "p",
        text: "When personal information is no longer required, we will delete or anonymise it where appropriate.",
      },
      { type: "h2", text: "8. Transactional Emails" },
      {
        type: "p",
        text: "If you make a purchase, register for an activity or use certain account features, we may send service-related or transactional emails.",
      },
      { type: "p", text: "These may include:" },
      {
        type: "ul",
        items: [
          "order confirmations;",
          "payment or order updates;",
          "delivery or collection information;",
          "information relating to a course, seminar or event;",
          "account or security emails; and",
          "other communications necessary to provide the service you requested.",
        ],
      },
      {
        type: "p",
        text: "These communications are different from marketing emails and may be necessary to perform our contract with you or administer the requested service.",
      },
      { type: "h2", text: "9. Marketing" },
      {
        type: "p",
        text: "We may send marketing communications where you have consented to receive them or where another lawful basis permits us to do so.",
      },
      {
        type: "p",
        text: "Where applicable, you can unsubscribe using the link provided in a marketing email or by contacting us.",
      },
      {
        type: "p",
        text: "Unsubscribing from marketing will not prevent us from sending necessary service-related communications, such as order confirmations or important membership information.",
      },
      { type: "h2", text: "10. Cookies and Analytics" },
      {
        type: "p",
        text: "Our website may use cookies and similar technologies for essential website functions and, where permitted, analytics and other optional purposes.",
      },
      {
        type: "p",
        text: "Where consent is required, non-essential cookies will not be used unless you choose to allow them.",
      },
      {
        type: "p",
        text: "You can change your cookie preferences using the controls provided on the website where available.",
      },
      {
        type: "p",
        text: "For further information, please see our Cookie Policy or cookie information provided on the website.",
      },
      { type: "h2", text: "11. Data Security" },
      {
        type: "p",
        text: "We take appropriate technical and organisational measures to protect personal information against unauthorised access, loss, misuse, alteration or disclosure.",
      },
      {
        type: "p",
        text: "Access to administrative systems and customer/order information is restricted to authorised users.",
      },
      {
        type: "p",
        text: "No internet or electronic storage system can be guaranteed to be completely secure, but we take reasonable steps appropriate to the nature of the information we process.",
      },
      { type: "h2", text: "12. International Data Transfers" },
      {
        type: "p",
        text: "Some of the service providers we use may process or store personal information outside the United Kingdom.",
      },
      {
        type: "p",
        text: "Where personal information is transferred internationally, we take appropriate steps to ensure that the transfer is made in accordance with applicable UK data protection law, including the use of recognised safeguards where required.",
      },
      { type: "h2", text: "13. Your Data Protection Rights" },
      {
        type: "p",
        text: "Depending on the circumstances, UK data protection law gives you rights in relation to your personal information.",
      },
      { type: "p", text: "These may include the right to:" },
      {
        type: "ul",
        items: [
          "ask for a copy of personal information we hold about you;",
          "ask us to correct inaccurate or incomplete information;",
          "ask us to delete personal information in certain circumstances;",
          "ask us to restrict the processing of your information in certain circumstances;",
          "object to certain processing;",
          "receive certain information in a portable format; and",
          "withdraw consent where processing is based on consent.",
        ],
      },
      {
        type: "p",
        text: "These rights are subject to the conditions and exemptions provided by law. For example, we may need to retain certain transaction information despite a request for deletion where we have a legal obligation to keep it.",
      },
      {
        type: "p",
        text: "To exercise your rights, please contact us using the details below.",
      },
      {
        type: "p",
        text: "You also have the right to complain to the Information Commissioner's Office (ICO), the UK's data protection regulator.",
      },
      { type: "h2", text: "14. Children's Information" },
      {
        type: "p",
        text: "We provide classes for children and may therefore process personal information relating to junior members.",
      },
      {
        type: "p",
        text: "Where appropriate, information about junior members is provided by or handled in conjunction with their parent or guardian.",
      },
      {
        type: "p",
        text: "We use this information only where reasonably necessary to administer junior membership, training, safeguarding and related club activities, or where otherwise permitted or required by law.",
      },
      { type: "h2", text: "15. Third-Party Websites" },
      {
        type: "p",
        text: "Our website may contain links to websites operated by other organisations.",
      },
      {
        type: "p",
        text: "We are not responsible for the privacy practices of third-party websites. We recommend reviewing the relevant privacy information when visiting another website.",
      },
      { type: "h2", text: "16. Changes to This Privacy Policy" },
      {
        type: "p",
        text: "We may update this Privacy Policy from time to time to reflect changes to our services, technology or legal obligations.",
      },
      {
        type: "p",
        text: "The current version will be published on this page and the Last Updated date will be changed when appropriate.",
      },
      { type: "h2", text: "17. Contact Us" },
      {
        type: "p",
        text: "If you have questions about this Privacy Policy, how we use your personal information or your data protection rights, please contact:",
      },
      { type: "p", text: "Kingston Jiu Jitsu Ltd" },
      { type: "p", text: "Company number: 11578178" },
      { type: "p", text: "Email: admin@kingstonjiujitsu.com" },
      { type: "p", text: "Telephone: 07584 131335" },
      {
        type: "p",
        text: "You can also find information about your data protection rights from the Information Commissioner's Office at ico.org.uk.",
      },
    ],
  },
  {
    slug: "child-protection-policy",
    title: "Child Protection Policy",
    description: "Kingston Jiu Jitsu's commitment to safeguarding and protecting children who train at the club.",
    blocks: [
      { type: "p", text: "Last Reviewed Date: March 2025" },
      { type: "p", text: "Next Review Date: March 2027" },
      { type: "p", text: "Kingston Jiu Jitsu is committed to guaranteeing that we do everything possible to ensure children are safe whilst training at our club. This policy applies to all instructors, and anyone working on behalf of Kingston Jiu Jitsu." },
      { type: "p", text: "The purpose of this policy:" },
      { type: "ul", items: [
        "To protect children and young people who train at Kingston Jiu Jitsu.",
        "To provide instructors with the principles that guide our approach to safeguarding and child protection.",
      ] },
      { type: "p", text: "We recognise that:" },
      { type: "ul", items: [
        "The welfare of the child is paramount, as given in the Children Act 1989.",
        "All children, regardless of age, disability, gender, racial heritage, religious belief, sexual orientation, or identity, have the right to equal protection from all types of harm and abuse.",
        "Some children are additionally vulnerable because of the impact of previous experience, their level of dependency, communication needs or other issues.",
        "Working in partnership with children, young people, their parents, carers, and other agencies is essential in promoting young people’s welfare.",
      ] },
      { type: "p", text: "We will seek to keep children and young people safe by:" },
      { type: "ul", items: [
        "Valuing them, listening to, and respecting them.",
        "Appointing a Designated Safeguarding Officer (DSO) for children and young people.",
        "Adopting child protection and safeguarding practices through procedures and a code of conduct for all the instructors.",
      ] },
      { type: "p", text: "We ensure that the following happens with our instructors:" },
      { type: "ul", items: [
        "Instructors are all DBS Checked",
        "Instructors complete the NSPCC 'Child Protection in Sport and Physical Activity' on an annual basis",
        "Reference Checks are made on instructors",
        "Instructors read and abide by our Child Protection Policy",
        "Instructors have a trial period in which to develop their skills under supervision and they have ongoing support and monitoring",
        "There are always at least 2 instructors in each class",
      ] },
      { type: "p", text: "The guidelines within this booklet are to:" },
      { type: "ul", items: [
        "Increase awareness of the different forms of abuse.",
        "Present the responsibilities, of each instructor to protect all children in their classes.",
        "Outline a code of conduct for instructors working with children.",
      ] },
      { type: "p", text: "Kingston Jiu Jitsu Child Protection Booklet" },
      { type: "p", text: "What is child abuse?" },
      { type: "p", text: "The Children Act 1989 defines children as those under the age of 18 and is concerned with the protection of children from any form of abuse. There are five recognised forms of child abuse." },
      { type: "ul", items: [
        "Physical",
      ] },
      { type: "p", text: "Physical abuse is when a child suffers some form of physical injury e.g. bone breaks, burns or scalds, which are not the result of an accident. Some signs of physical abuse may be visible, but injuries may be covered by clothing. Some children may find it hard to explain injuries and be reluctant to remove clothing in warm weather, as injuries will be visible." },
      { type: "ul", items: [
        "Emotional",
      ] },
      { type: "p", text: "Emotional abuse is the result of a child receiving little attention, but could also occur from being made to feel inadequate by remarks made by parents or other adults. A change in behaviour by a child, which is abrupt or gradual, can be a characteristic of emotional abuse. Speech may be affected and the child may develop nervous behaviour. In tennis, the indicators are that the child loses interest in playing or avoids match situations due to the fear of verbal abuse, which may follow." },
      { type: "ul", items: [
        "Neglect",
      ] },
      { type: "p", text: "A child failing to attain the development expected for the age can indicate neglect. It can be long term and so it is important to watch out for both physical and behavioural signs. If a child is badly cared for, they may lack friends because of their appearance and they may arrive late for coaching sessions, with no sign of parental or adult support." },
      { type: "ul", items: [
        "Sexual",
      ] },
      { type: "p", text: "Sexual abuse occurs when a child is involved in sexual acts against their will. It may also take the form of involving the child in pornographic material such as magazines or videos. The adult will threaten the child not to reveal what is happening and the child will often stay quiet, as they feel responsible and ashamed. The indicators of sexual abuse may be physical in terms of pain and/or changes in behaviour. 96% of abusers are in some way known to their victim, either being in a position of trust or an influential person." },
      { type: "ul", items: [
        "Bullying",
      ] },
      { type: "p", text: "Bullying can be by another young person or another adult or an instructor. This may be physical, verbal, or emotional bullying or a combination of these. The person being bullied may be weaker and possibly younger, but the outcome for them will be a very distressing situation." },
      { type: "p", text: "The Responsibilities of an Instructor at Kingston Jiu Jitsu working with children" },
      { type: "ul", items: [
        "To recognise signs of abuse and to take any necessary action to help the child",
      ] },
      { type: "p", text: "They’re maybe several signs that child abuse is taking place. It could some signs of physical or behavioural change in a child or from something the child says, or by something another person says. It is important to be aware and vigilant and to deal with the fact in an objective manner." },
      { type: "p", text: "If the child indicates that they want to talk, then it is important to follow the following principles:" },
      { type: "ul", items: [
        "Stay calm and reassure the child",
        "For a child to disclose abuse takes great courage, but explain that you will need to contact other professionals who will be able to give the help which is needed",
        "You must listen to what the child says and record what has been said as soon as possible, recording the exact words as spoken by the child.",
        "Then report it to your Designated Safeguarding Officer who in turn will report it to the relevant Social Care Team.",
        "It is very important not to tell anyone else about the complaint until you have discussed it with the relevant Social Care Team.",
        "To ensure that behaviour when working with children, cannot be called into question",
      ] },
      { type: "p", text: "As a KJJ instructor you have a duty to protect children from harm. You should also be aware of the impact of your words and actions on young players. It is important to ensure that your verbal and non-verbal communication with all players is positive." },
      { type: "p", text: "You have a duty to prevent physical injury and your training should always be very objective ensuring the programmes are appropriate to individual players in terms of their age, ability, and physical development." },
      { type: "p", text: "Any behaviour, word, or actions, which could be construed by others as sexual in nature are inappropriate and will be viewed with serious concern." },
      { type: "p", text: "Kingston Jiu Jitsu Code of Conduct for working with children" },
      { type: "p", text: "Those working with children at KJJ should:" },
      { type: "ul", items: [
        "Be professional and maintain the highest standards of personal behaviour at all times.",
        "Be aware of situations which can be misconstrued by others, for example, if an instructor is alone with a child before a class, in a changing room, or similar place, they are open to the possibility of allegations.",
        "Be vigilant and aware of how actions can be misinterpreted.",
        "Not appear to favour or show interest in one child more than another.",
        "Be very aware that physically handling a participant, such as when demonstrating a technique, could be misconstrued by an observer or even the participant. Explain to the member of the club what they will be shown.",
        "Be aware of your language at all times and never use inappropriate language.",
        "Design and use training methods and training programmes which are wholly appropriate to the individual child.",
        "Ensure that, you are not alone when teaching children on an individual basis. If this is unavoidable then the parents should be made aware of the situation for the sake of the instructor.",
        "Conduct all dealings with children in a public environment in full view of others, in order for all behaviour to be observed.",
        "Report any concerns within the area of child protection (physical, emotional, sexual or neglect) in confidence and without delay, to the Designated Safeguarding Officer.",
        "Not, at any time, discuss an allegation or suspicion with another person, other than the police, before the DSO has been contacted.",
        "hen reporting an allegation or suspicion, record information, including relevant details (this includes the nature of the allegation, background information of the parties involved, the period which the allegation relates to and the degree to which the information is known to be fact rather than opinion or hearsay).",
      ] },
      { type: "p", text: "Designated Safeguarding Officer (DSO)" },
      { type: "ul", items: [
        "Name: Clare Barton",
        "Email: admin@kingstonjiujitsu.com",
      ] },
      { type: "p", text: "NSPCC Helpline: 0808 800 5000" },
    ],
  },
  {
    slug: "terms-and-conditions",
    title: "Terms & Conditions",
    description:
      "Membership, training, licence fees, shop purchases and related terms for Kingston Jiu Jitsu.",
    blocks: [
      { type: "h2", text: "Who we are" },
      {
        type: "p",
        text: "Kingston Jiu Jitsu is operated by Kingston Jiu Jitsu Ltd (company number 11578178).",
      },
      {
        type: "p",
        text: "These Terms cover membership, training, annual licence and insurance fees, and purchases made through Kingston Jiu Jitsu, including physical merchandise, courses, seminars and competitions.",
      },
      { type: "h2", text: "Membership (DFC / FastDD)" },
      {
        type: "ul",
        items: [
          "Memberships are personal and non-transferable.",
          "Online Direct Debit memberships are managed through DFC FastDD for a minimum term of 4, 6, 8 or 12 months.",
          "After the minimum term, membership continues month to month unless you give DFC / FastDD at least 30 days’ notice.",
          "We may update these Terms with at least 14 days’ notice.",
          "We may end membership for repeated or serious breaches of these Terms or club etiquette.",
          "Members must purchase and maintain a valid annual licence and insurance within their first month of training.",
        ],
      },
      { type: "h2", text: "Training" },
      {
        type: "ul",
        items: [
          "Classes run at the times and venues shown on the Kingston Jiu Jitsu website. We may change days, times or venues when necessary.",
          "Classes may occasionally be cancelled because of instructor or venue unavailability or other unforeseen circumstances. We will make reasonable efforts to give prompt notice.",
          "Members must follow instructors’ directions and train with respect and appropriate regard for their own safety and that of others.",
        ],
      },
      { type: "h2", text: "Membership fees" },
      {
        type: "ul",
        items: [
          "Fees must be paid on time. Unpaid fees may result in suspension from training.",
          "Missed payments must be cleared before returning to training unless an agreed repayment arrangement is in place and being maintained.",
          "If arrears remain during a minimum membership term without valid cancellation, the outstanding balance for that term remains payable.",
          "Student rates require valid student identification. Military and Emergency Services rates are for actively serving personnel.",
          "We may change membership fees with at least 14 days’ notice.",
        ],
      },
      { type: "h2", text: "Junior members" },
      {
        type: "ul",
        items: [
          "Members under 18 require the consent of a parent or guardian.",
          "Parents or guardians remain responsible for junior members before a class begins and resume responsibility when the class finishes.",
          "KJJ is responsible for supervising junior members during their class.",
          "At 16, junior membership becomes adult student membership. At 18, this becomes full adult membership unless valid evidence of continuing student status is provided.",
          "KJJ follows safeguarding policies intended to protect children and vulnerable members.",
        ],
      },
      { type: "h2", text: "Participation, health and risk" },
      {
        type: "ul",
        items: [
          "Brazilian Jiu Jitsu is a contact martial art involving strenuous physical activity and an inherent risk of injury.",
          "Members are responsible for considering whether they are fit to train and should seek appropriate medical advice if unsure. Members should inform an instructor of anything relevant to their safe participation in a class.",
          "Members must follow instructors’ directions, train responsibly and stop training and inform an instructor if they become unwell or injured.",
          "Members must not train while under the influence of alcohol or drugs and are expected to maintain appropriate personal hygiene and training etiquette.",
          "Nothing in these Terms excludes or restricts liability for death or personal injury caused by negligence, or any other liability that cannot lawfully be excluded.",
        ],
      },
      { type: "h2", text: "30-day suitability trial" },
      {
        type: "p",
        text: "Kingston Jiu Jitsu is a private organisation and reserves the right to refuse admission or membership, subject to applicable law.",
      },
      {
        type: "p",
        text: "The first 30 days of training serve as a trial period to assess a student’s suitability for, and safe participation in, the class. During this period, KJJ may end the membership and refund it at its discretion.",
      },
      { type: "h2", text: "Annual licence and insurance fees" },
      {
        type: "p",
        text: "Adult members can purchase their annual licence and insurance for £35:",
      },
      {
        type: "paypal",
        buttonId: "GDEEEQ45HCHVQ",
        label: "Buy adult licence & insurance – £35",
      },
      {
        type: "p",
        text: "Junior members can purchase their annual licence and insurance for £30:",
      },
      {
        type: "paypal",
        buttonId: "H66E9XVD7TFLQ",
        label: "Buy junior licence & insurance – £30",
      },
      { type: "h2", text: "Physical merchandise" },
      {
        type: "ul",
        items: [
          "Physical merchandise purchased through our online shop is available for UK delivery or, where offered, free collection from Kingston Jiu Jitsu.",
          "Prices are shown in pounds sterling and include VAT where applicable. Any applicable delivery charge will be shown before payment.",
          "We make reasonable efforts to ensure product descriptions, photographs, prices and sizing information are accurate.",
          "Goods must be as described, of satisfactory quality and fit for purpose in accordance with your statutory rights.",
          "Unless a different delivery period has been agreed with you, goods will be delivered without undue delay and within 30 days.",
        ],
      },
      { type: "h2", text: "Cancelling an online merchandise order" },
      {
        type: "ul",
        items: [
          "For most physical goods purchased online, you have the right to cancel your order without giving a reason within 14 days after receiving the goods.",
          "If you wish to cancel, contact us clearly stating that you wish to cancel and identifying your order.",
          "After notifying us of cancellation, you should return the goods within 14 days.",
          "Certain statutory exceptions may apply, including to some personalised goods and sealed goods that are not suitable for return for health-protection or hygiene reasons once unsealed.",
        ],
      },
      { type: "h2", text: "Returns and refunds" },
      {
        type: "ul",
        items: [
          "For a change-of-mind return, goods should be returned in good condition and should not have been used beyond what is reasonably necessary to inspect them. In particular, clothing or training equipment should not have been trained in or washed.",
          "You are normally responsible for the direct cost of returning unwanted goods. We recommend using a tracked service.",
          "Where you validly cancel an online order, we will provide the refund required by law. We may withhold the refund until we have received the returned goods or you provide evidence that they have been sent back. A deduction may be made where goods have been handled beyond what was reasonably necessary to inspect them and their value has consequently been reduced.",
        ],
      },
      { type: "h2", text: "Faulty, damaged or incorrect goods" },
      {
        type: "ul",
        items: [
          "If goods are faulty, damaged, not as described or we have sent you the wrong item, please contact us promptly.",
          "We will provide the appropriate remedy in accordance with your statutory consumer rights. This may include repair, replacement or refund depending on the circumstances. Your statutory rights in relation to faulty goods are not affected by our change-of-mind returns policy.",
        ],
      },
      { type: "h2", text: "Exchanges" },
      {
        type: "ul",
        items: [
          "We do not routinely offer direct exchanges.",
          "If you wish to change the size, colour or variant of an unwanted item, you can return the original item in accordance with the returns provisions above and place a new order.",
          "This does not affect your rights where an item is faulty, incorrect or not as described.",
        ],
      },
      { type: "h2", text: "Courses, seminars and competitions" },
      {
        type: "ul",
        items: [
          "We may sell places on courses, seminars, competitions and other activities through our online shop.",
          "Details including the price, date, time and location will be shown on the relevant listing.",
          "Different cancellation provisions may apply to leisure activities taking place on a specific date or during a specific period. Any specific cancellation terms will be shown with the relevant activity where applicable.",
        ],
      },
      { type: "h2", text: "Privacy" },
      {
        type: "p",
        text: "We use personal information to administer memberships, classes and purchases in accordance with applicable UK data-protection law.",
      },
      {
        type: "p",
        text: "Please see our Privacy Policy for further information.",
      },
      { type: "h2", text: "Contact" },
      {
        type: "p",
        text: "For questions about membership, purchases, delivery, collection or returns, contact:",
      },
      { type: "p", text: "Kingston Jiu Jitsu Ltd" },
      { type: "p", text: "Company number: 11578178" },
      {
        type: "linkPara",
        lead: "Email: ",
        linkText: "admin@kingstonjiujitsu.com",
        href: "mailto:admin@kingstonjiujitsu.com",
      },
      { type: "p", text: "Telephone: 07584 131335" },
      {
        type: "p",
        text: "Please contact us before returning merchandise so that we can provide the appropriate return instructions.",
      },
      { type: "h2", text: "Governing law" },
      {
        type: "p",
        text: "These Terms are governed by the laws of England and Wales.",
      },
      {
        type: "p",
        text: "Nothing in these Terms affects any statutory consumer rights or other rights that cannot lawfully be excluded or restricted.",
      },
      { type: "h2", text: "Agreement" },
      {
        type: "p",
        text: "By joining Kingston Jiu Jitsu, participating in training or making a purchase from us, you agree to the Terms applicable to that activity.",
      },
    ],
  },
  {
    slug: "training-etiquette-safety",
    title: "Training Etiquette & Safety",
    description:
      "Health, hygiene and safety guidelines for training at Kingston Jiu Jitsu, including our leg lock training policy and code of conduct.",
    blocks: [
      { type: "p", text: "Kingston Jiu Jitsu is committed to providing a safe and positive environment for everyone to train in. All instructors abide by our code of conduct, which can be found in our safeguarding policy." },
      { type: "h2", text: "Health & Safety of Our Members" },
      { type: "p", text: "We take the health and safety of our members very seriously at KJJ. Jiu Jitsu is a close-contact martial art. High standards of safety and hygiene are essential to protect everyone who trains here." },
      { type: "p", text: "Please read and follow the guidelines below." },
      { type: "h2", text: "General Health & Hygiene" },
      { type: "ul", items: [
        "Always train in clean kit. Gi and rash guard must be freshly washed before every class.",
        "Rash guards are mandatory in all classes for hygiene reasons.",
        "Do not attend class in unwashed clothing.",
        "Shower regularly and maintain good personal hygiene.",
        "Keep nails short and clean to prevent scratches and cuts.",
        "Remove all jewellery and piercings before training, or securely tape if they cannot be removed.",
        "Wear footwear (flip-flops or sliders) off the mat.",
        "Never walk onto the mats with outdoor shoes or bare feet from changing rooms or toilets.",
        "Cover and clean any cuts or wounds before training.",
        "If you bleed during class, stop immediately, clean the area, and disinfect before returning.",
      ] },
      { type: "h2", text: "Training When Sick or Injured" },
      { type: "ul", items: [
        "Do not attend class if you are unwell.",
        "Even minor illness can spread quickly in a close-contact environment.",
        "Do not train with any skin infection (ringworm, staph, impetigo, herpes).",
        "These infections spread rapidly and can shut down the academy.",
        "If injured, be honest with yourself and your training partners.",
        "Avoid movements that aggravate injury.",
        "Inform your instructor of any relevant health conditions or injuries before training.",
      ] },
      { type: "h2", text: "Our Safety Culture" },
      { type: "ul", items: [
        "Respect your training partners at all times.",
        "Safety comes before ego.",
        "Protect your partner, even if they do not tap.",
        "Report unsafe behaviour, illness, or hygiene concerns to an instructor.",
        "Train to learn and improve, not to injure.",
      ] },
      { type: "h2", text: "Class Attendance & Punctuality" },
      { type: "p", text: "Adult classes must be booked in advance." },
      { type: "p", text: "Arrive on time and be ready to train at the start of class. This allows for a proper warm-up and helps reduce injury risk." },
      { type: "p", text: "Late arrivals are disruptive to both the instructor and other students. If you arrive late, you may only join the class at the instructor’s discretion." },
      { type: "p", text: "If permitted to join:" },
      { type: "ul", items: [
        "Enter the mat area quietly and without interrupting.",
        "Complete an appropriate warm-up before engaging in drills or sparring.",
        "Follow any instructions given by the coach before joining the group.",
      ] },
      { type: "p", text: "Consistent punctuality is part of respecting your training partners and maintaining a safe training environment." },
      { type: "h2", text: "Leg Lock Training Policy" },
      { type: "p", text: "At Kingston Jiu Jitsu, we take a progressive approach to leg lock training. Everyone should learn them in a safe, structured environment. Because leg locks carry specific risks, especially advanced submissions such as heel hooks, they must be trained with care and control." },
      { type: "h3", text: "KJJ Leg Lock Training Rules" },
      { type: "ul", items: [
        "Control first, always: apply submissions slowly and with precision.",
        "Never crank or explode into a movement.",
        "Tap early, tap often.",
        "Defenders must tap as soon as discomfort is felt.",
        "Catch and release: secure the position, then release.",
        "Focus on control, not finishing.",
        "No twisting escapes from locked-in submissions.",
        "Progress gradually from basic ankle locks to advanced techniques under coaching.",
        "Understand the risks of knee reaping and avoid reckless pressure.",
        "Leg lock training must be supervised by an instructor.",
        "Communicate clearly with your training partner.",
        "Release immediately if your partner moves unsafely.",
        "Prioritise your partner’s safety over winning the roll.",
      ] },
      {
        type: "linkPara",
        lead: "For more detail, please read ",
        linkText: "Marc’s article on safe leg lock training",
        href: "https://www.jiujitsubrotherhood.com/blogs/blog/how-to-train-leg-locks-safely",
        trail: ".",
      },
    ],
  },
];

/**
 * Some source pages (notably the Privacy Policy, imported from WordPress) store
 * list items as a "-" paragraph followed by the item text. Collapse those runs
 * into proper bulleted lists so they render as real <ul>s.
 */
function normalizeBlocks(blocks: LegalBlock[]): LegalBlock[] {
  const out: LegalBlock[] = [];
  let i = 0;
  while (i < blocks.length) {
    const b = blocks[i];
    if (b.type === "p" && b.text.trim() === "-") {
      const items: string[] = [];
      while (
        i < blocks.length &&
        blocks[i].type === "p" &&
        (blocks[i] as { text: string }).text.trim() === "-"
      ) {
        const next = blocks[i + 1];
        if (next && next.type === "p") {
          items.push(next.text);
          i += 2;
        } else {
          i += 1;
        }
      }
      if (items.length) out.push({ type: "ul", items });
      continue;
    }
    out.push(b);
    i += 1;
  }
  return out;
}

export const legalPages: LegalPage[] = legalPagesRaw.map((p) => ({
  ...p,
  blocks: normalizeBlocks(p.blocks),
}));

export const legalSlugs = legalPages.map((p) => p.slug);

export function getLegalPage(slug: string): LegalPage | undefined {
  return legalPages.find((p) => p.slug === slug);
}
