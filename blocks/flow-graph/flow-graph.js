/**
 * Flow Graph block.
 *
 * Renders an interactive SVG flow diagram with optional animated packet replay.
 * Ported from oak-chain-docs/.vitepress/theme/components/FlowGraph.vue.
 *
 * Authoring contract (DA):
 *   | Flow Graph |
 *   | ---------- |
 *   | two-models |
 *
 * Optional second cell may carry configuration like `height: 340`.
 */

const NODE_TYPES = {
  USER: { icon: '👤', color: '#627EEA' },
  WALLET: { icon: '👛', color: '#f0b429' },
  AUTHOR: { icon: '✍️', color: '#8C8DFC' },
  VALIDATOR: { icon: '⚡', color: '#4ade80' },
  CONSENSUS: { icon: '🔄', color: '#627EEA' },
  OAK_STORE: { icon: '🌳', color: '#4ade80' },
  ETHEREUM: { icon: '⟠', color: '#627EEA' },
  CONTRACT: { icon: '📜', color: '#f85149' },
  IPFS: { icon: '🌐', color: '#65c2cb' },
  SEGMENT: { icon: '📦', color: '#8b949e' },
  CONTENT: { icon: '📄', color: '#e6edf3' },
  SIGNATURE: { icon: '🔐', color: '#f0b429' },
  TRANSACTION: { icon: '💸', color: '#4ade80' },
  AEM: { icon: '🏢', color: '#fa0f00' },
  CDN: { icon: '🌍', color: '#f48120' },
  PASSKEY: { icon: '🔑', color: '#a855f7' },
  EDS: { icon: '⚡', color: '#00c7b7' },
  AZURE: { icon: '☁️', color: '#0078d4' },
};

const EDGE_COLORS = {
  DATA: '#627EEA',
  CONTROL: '#8C8DFC',
  PAYMENT: '#f0b429',
  ASYNC: '#65c2cb',
};

const FLOW_WIDTHS = {
  architecture: 800,
  consensus: 700,
  'proposal-flow': 1050,
  'gc-overview': 900,
  'gc-compaction': 950,
  'gc-generations': 900,
  'gc-cleanup': 900,
  'gc-modes': 900,
  'aem-integration': 900,
  'binary-flow': 950,
  'validator-auth': 800,
  'two-models': 950,
  'json-to-jcr': 900,
};

const FLOWS = {
  'two-models': {
    nodes: [
      ['eds', 'EDS', 70, 80, 'EDS (aem.live)', 'Edge Delivery Services'],
      ['validators1', 'VALIDATOR', 280, 80, 'Validators', 'Raft consensus cluster'],
      ['ethereum1', 'ETHEREUM', 480, 80, 'Ethereum', 'Payment & verification'],
      ['label1', 'CONTENT', 680, 80, 'Model 1', 'Blockchain-Native (new apps)', 20],
      ['aem', 'AEM', 70, 260, 'Existing AEM', 'On-prem, AMS, AEMaaCS'],
      ['http', 'CONSENSUS', 280, 260, 'oak-segment-http', 'HTTP segment transfer'],
      ['validators2', 'VALIDATOR', 480, 260, 'Validators', 'Same cluster, different access'],
      ['label2', 'CONTENT', 680, 260, 'Model 2', 'AEM Integration (existing)', 20],
      ['ipfs', 'IPFS', 280, 170, 'Author IPFS', 'Binaries at source (CID only in validators)'],
    ],
    edges: [
      ['eds', 'validators1', 'DATA', 'HTTPS API'],
      ['validators1', 'ethereum1', 'PAYMENT', 'verify'],
      ['aem', 'http', 'DATA', 'mount'],
      ['http', 'validators2', 'DATA', 'segments'],
      ['validators1', 'ipfs', 'ASYNC', 'CID'],
      ['validators2', 'ipfs', 'ASYNC', 'CID'],
    ],
    sequence: [
      [['eds', 'validators1', '#00c7b7']],
      [['validators1', 'ethereum1', '#f0b429']],
      [['validators1', 'ipfs', '#65c2cb']],
      [['aem', 'http', '#fa0f00']],
      [['http', 'validators2', '#627EEA']],
      [['validators2', 'ipfs', '#65c2cb']],
    ],
  },
  'aem-integration': {
    nodes: [
      ['aem', 'AEM', 70, 180, 'Existing AEM', 'On-prem, AMS, AEMaaCS, or CQ variant'],
      ['composite', 'OAK_STORE', 220, 180, 'Composite Mount', 'Oak CompositeNodeStore'],
      ['local', 'SEGMENT', 220, 80, '/content (local)', 'Read-write local content'],
      ['http', 'CONSENSUS', 400, 180, 'oak-segment-http', 'HTTP persistence layer'],
      ['validators', 'VALIDATOR', 580, 180, 'Validators', 'Raft consensus cluster'],
      ['oakchain', 'OAK_STORE', 580, 80, '/oak-chain (remote)', 'Read-only blockchain content'],
      ['ethereum', 'ETHEREUM', 750, 180, 'Ethereum', 'Payment verification'],
    ],
    edges: [
      ['aem', 'composite', 'DATA', 'JCR API'],
      ['composite', 'local', 'DATA', 'read/write'],
      ['composite', 'http', 'ASYNC', 'read-only'],
      ['http', 'validators', 'DATA', 'segments'],
      ['validators', 'oakchain', 'DATA', 'serve'],
      ['validators', 'ethereum', 'PAYMENT', 'verify'],
    ],
    sequence: [
      [['aem', 'composite', '#fa0f00']],
      [['composite', 'local', '#627EEA']],
      [['composite', 'http', '#65c2cb']],
      [['http', 'validators', '#627EEA']],
      [['validators', 'oakchain', '#4ade80']],
      [['validators', 'ethereum', '#f0b429']],
    ],
  },
  write: {
    nodes: [
      ['author', 'AUTHOR', 70, 200, 'Author', 'Content editor (AEM Connector or SDK)'],
      ['wallet', 'WALLET', 200, 100, 'Author Wallet', 'Signs content with secp256k1 key'],
      ['proposal', 'SIGNATURE', 200, 300, 'Write Proposal', 'Signed content change request'],
      ['leader', 'VALIDATOR', 380, 200, 'Raft Leader', 'Receives and validates proposals'],
      ['consensus', 'CONSENSUS', 520, 100, 'Log Replication', 'Proposal replicated to followers'],
      ['followers', 'VALIDATOR', 520, 300, 'Followers', 'Replicate and acknowledge'],
      ['commit', 'TRANSACTION', 660, 200, 'Commit', 'Entry committed to log'],
      ['oak', 'OAK_STORE', 780, 200, 'Oak Store', 'Content persisted to segments'],
    ],
    edges: [
      ['author', 'wallet', 'DATA', 'content'],
      ['author', 'proposal', 'DATA', 'changes'],
      ['wallet', 'proposal', 'CONTROL', 'sign'],
      ['proposal', 'leader', 'DATA', 'submit'],
      ['leader', 'consensus', 'CONTROL', 'append'],
      ['leader', 'followers', 'DATA', 'replicate'],
      ['consensus', 'commit', 'CONTROL', 'majority'],
      ['followers', 'commit', 'ASYNC', 'ack'],
      ['commit', 'oak', 'DATA', 'apply'],
    ],
    sequence: [
      [['author', 'wallet', '#627EEA']],
      [['author', 'proposal', '#627EEA']],
      [['wallet', 'proposal', '#8C8DFC']],
      [['proposal', 'leader', '#627EEA']],
      [['leader', 'consensus', '#8C8DFC'], ['leader', 'followers', '#627EEA']],
      [['consensus', 'commit', '#8C8DFC'], ['followers', 'commit', '#65c2cb']],
      [['commit', 'oak', '#627EEA']],
    ],
  },
  payment: {
    nodes: [
      ['user', 'USER', 70, 180, 'End User', 'Initiates content write via UI'],
      ['metamask', 'WALLET', 200, 180, 'MetaMask', 'Signs Ethereum transaction'],
      ['contract', 'CONTRACT', 380, 180, 'ValidatorPayment', 'Smart contract on Ethereum'],
      ['event', 'ETHEREUM', 520, 100, 'PaymentReceived', 'Event emitted on-chain'],
      ['validators', 'VALIDATOR', 520, 260, 'Validators', 'Monitor contract events'],
      ['authorize', 'SIGNATURE', 680, 180, 'Write Authorized', 'Payment verified, write allowed'],
    ],
    edges: [
      ['user', 'metamask', 'CONTROL', 'connect'],
      ['metamask', 'contract', 'PAYMENT', 'ETH'],
      ['contract', 'event', 'DATA', 'emit'],
      ['contract', 'validators', 'ASYNC', 'notify'],
      ['event', 'validators', 'DATA', 'verify'],
      ['validators', 'authorize', 'CONTROL', 'allow'],
    ],
    sequence: [
      [['user', 'metamask', '#8C8DFC']],
      [['metamask', 'contract', '#f0b429']],
      [['contract', 'event', '#627EEA'], ['contract', 'validators', '#65c2cb']],
      [['event', 'validators', '#627EEA']],
      [['validators', 'authorize', '#8C8DFC']],
    ],
  },
  ipfs: {
    nodes: [
      ['binary', 'CONTENT', 70, 180, 'Binary Asset', 'Image, PDF, video uploaded'],
      ['author', 'AUTHOR', 200, 180, 'Author IPFS', 'Author runs local IPFS node'],
      ['pin', 'IPFS', 350, 100, 'Pin Locally', 'Binary pinned to author node'],
      ['cid', 'SEGMENT', 350, 260, 'CID Generated', 'Content-addressed hash'],
      ['oak', 'OAK_STORE', 520, 180, 'Oak Reference', 'CID stored as blob reference'],
      ['dht', 'IPFS', 680, 100, 'DHT Announce', 'CID announced to network'],
      ['retrieve', 'USER', 680, 260, 'Global Retrieve', 'Anyone can fetch via CID'],
    ],
    edges: [
      ['binary', 'author', 'DATA', 'upload'],
      ['author', 'pin', 'CONTROL', 'ipfs add'],
      ['author', 'cid', 'DATA', 'hash'],
      ['pin', 'oak', 'ASYNC', 'reference'],
      ['cid', 'oak', 'DATA', 'store CID'],
      ['oak', 'dht', 'ASYNC', 'announce'],
      ['dht', 'retrieve', 'DATA', 'discover'],
      ['cid', 'retrieve', 'CONTROL', 'address'],
    ],
    sequence: [
      [['binary', 'author', '#627EEA']],
      [['author', 'pin', '#8C8DFC'], ['author', 'cid', '#627EEA']],
      [['pin', 'oak', '#65c2cb'], ['cid', 'oak', '#627EEA']],
      [['oak', 'dht', '#65c2cb']],
      [['dht', 'retrieve', '#627EEA'], ['cid', 'retrieve', '#8C8DFC']],
    ],
  },
  consensus: {
    nodes: [
      ['follower', 'VALIDATOR', 120, 140, 'Follower', 'Initial state, receives heartbeats'],
      ['candidate', 'CONSENSUS', 350, 80, 'Candidate', 'Election timeout, requests votes'],
      ['leader', 'VALIDATOR', 580, 140, 'Leader', 'Sends heartbeats, handles writes'],
      ['heartbeat', 'SIGNATURE', 350, 260, 'Heartbeat', 'AppendEntries RPC (empty)'],
      ['election', 'TRANSACTION', 120, 320, 'Election', 'RequestVote RPC to all nodes'],
    ],
    edges: [
      ['follower', 'candidate', 'CONTROL', 'timeout'],
      ['candidate', 'leader', 'CONTROL', 'majority votes'],
      ['candidate', 'follower', 'ASYNC', 'higher term'],
      ['leader', 'follower', 'ASYNC', 'higher term'],
      ['leader', 'heartbeat', 'DATA', 'send'],
      ['heartbeat', 'follower', 'DATA', 'reset timer'],
      ['follower', 'election', 'CONTROL', 'no heartbeat'],
      ['election', 'candidate', 'DATA', 'start'],
    ],
    sequence: [
      [['follower', 'election', '#8C8DFC']],
      [['election', 'candidate', '#627EEA']],
      [['follower', 'candidate', '#8C8DFC']],
      [['candidate', 'leader', '#8C8DFC']],
      [['leader', 'heartbeat', '#627EEA']],
      [['heartbeat', 'follower', '#627EEA']],
    ],
  },
  architecture: {
    nodes: [
      ['sling', 'AUTHOR', 100, 60, 'Author', 'AEM Connector or Oak Chain SDK'],
      ['metamask', 'WALLET', 260, 60, 'MetaMask', 'Wallet for signing & payment'],
      ['validator1', 'VALIDATOR', 80, 180, 'Validator 1', 'Raft consensus node (Leader)'],
      ['validator2', 'VALIDATOR', 220, 180, 'Validator 2', 'Raft consensus node (Follower)'],
      ['validator3', 'VALIDATOR', 360, 180, 'Validator 3', 'Raft consensus node (Follower)'],
      ['ipfs', 'IPFS', 500, 180, 'IPFS', 'Binary storage via content addressing'],
      ['ethereum', 'ETHEREUM', 620, 60, 'Ethereum', 'Payment verification on Sepolia'],
      ['eds', 'CONTENT', 220, 300, 'Edge Delivery', 'CDN delivery with 100 Lighthouse score'],
    ],
    edges: [
      ['sling', 'validator1', 'DATA', 'write'],
      ['metamask', 'ethereum', 'PAYMENT', 'pay'],
      ['ethereum', 'validator2', 'ASYNC', 'verify'],
      ['validator1', 'validator2', 'CONTROL', 'replicate'],
      ['validator2', 'validator3', 'CONTROL', 'replicate'],
      ['validator3', 'ipfs', 'ASYNC', 'store CID'],
      ['validator2', 'eds', 'DATA', 'serve'],
    ],
    sequence: [
      [['sling', 'validator1', '#627EEA']],
      [['metamask', 'ethereum', '#f0b429']],
      [['ethereum', 'validator2', '#65c2cb']],
      [['validator1', 'validator2', '#8C8DFC']],
      [['validator2', 'validator3', '#8C8DFC']],
      [['validator3', 'ipfs', '#65c2cb']],
      [['validator2', 'eds', '#627EEA']],
    ],
  },
  'proposal-flow': {
    nodes: [
      ['author', 'AUTHOR', 70, 220, 'Author / Client', 'Submits write or delete proposal'],
      ['wallet', 'WALLET', 210, 120, 'Wallet + Signature', 'Signs proposal payload'],
      ['payment', 'CONTRACT', 210, 320, 'Payment Path', 'Tier + tx hash (or mock) checked before acceptance'],
      ['ingress', 'VALIDATOR', 380, 220, 'Leader Ingress', 'Validates auth, schema, and routes request'],
      ['unverified', 'SEGMENT', 540, 90, 'Unverified Queue', 'Raw accepted proposals awaiting verifier pass'],
      ['verifier', 'CONSENSUS', 540, 220, 'Verifier Agents', 'Proof/auth/payment checks + queue bookkeeping'],
      ['epoch', 'ETHEREUM', 540, 350, 'Epoch Buckets', 'Standard/Express batched by epoch; Priority fast path'],
      ['finalizer', 'CONSENSUS', 710, 220, 'Epoch Finalizer', 'Converts ready epoch buckets into message batches'],
      ['backpressure', 'VALIDATOR', 860, 120, 'Backpressure Gate', 'Caps in-flight sends and re-queues on timeout'],
      ['aeron', 'CONSENSUS', 860, 320, 'Aeron + Raft Log', 'Replicates batches to all validators'],
      ['commit', 'TRANSACTION', 980, 220, 'Deterministic Apply', 'Commit to Oak store + proposal persistence'],
    ],
    edges: [
      ['author', 'wallet', 'CONTROL', 'sign'],
      ['author', 'payment', 'PAYMENT', 'tier + tx'],
      ['wallet', 'ingress', 'DATA', 'proposal'],
      ['payment', 'ingress', 'CONTROL', 'verify route'],
      ['ingress', 'unverified', 'DATA', 'enqueue'],
      ['unverified', 'verifier', 'CONTROL', 'dequeue'],
      ['verifier', 'epoch', 'DATA', 'classify by epoch+tier'],
      ['epoch', 'finalizer', 'CONTROL', 'ready to finalize'],
      ['finalizer', 'backpressure', 'CONTROL', 'batch send request'],
      ['backpressure', 'aeron', 'ASYNC', 'offer / retry'],
      ['aeron', 'commit', 'DATA', 'quorum commit'],
      ['commit', 'ingress', 'ASYNC', 'counters + status'],
    ],
    sequence: [
      [['author', 'wallet', '#8C8DFC'], ['author', 'payment', '#f0b429']],
      [['wallet', 'ingress', '#627EEA'], ['payment', 'ingress', '#65c2cb']],
      [['ingress', 'unverified', '#627EEA']],
      [['unverified', 'verifier', '#8C8DFC']],
      [['verifier', 'epoch', '#627EEA']],
      [['epoch', 'finalizer', '#8C8DFC']],
      [['finalizer', 'backpressure', '#f0b429']],
      [['backpressure', 'aeron', '#65c2cb']],
      [['aeron', 'commit', '#627EEA']],
      [['commit', 'ingress', '#4ade80']],
    ],
  },
  'gc-overview': {
    nodes: [
      ['epoch', 'ETHEREUM', 70, 220, 'Epoch Finalization', 'Ethereum epoch triggers GC check'],
      ['leader', 'VALIDATOR', 210, 120, 'Raft Leader', 'Only leader can propose GC'],
      ['gc_proposal', 'SIGNATURE', 210, 320, 'GC Proposal', 'Signed compaction proposal'],
      ['raft', 'CONSENSUS', 400, 220, 'Raft Consensus', 'Proposal replicated to all validators'],
      ['deterministic', 'VALIDATOR', 400, 90, 'Deterministic', 'All nodes apply same GC'],
      ['local_gc', 'OAK_STORE', 400, 350, 'Local Compaction', 'Each validator compacts locally'],
      ['commit', 'TRANSACTION', 590, 220, 'Raft Commit', 'GC committed to consensus log'],
      ['reclaimed', 'CONTENT', 750, 220, 'Space Reclaimed', 'All validators reclaim same space'],
    ],
    edges: [
      ['epoch', 'leader', 'CONTROL', 'trigger'],
      ['epoch', 'gc_proposal', 'DATA', 'epoch ref'],
      ['leader', 'gc_proposal', 'CONTROL', 'create'],
      ['gc_proposal', 'raft', 'DATA', 'broadcast'],
      ['raft', 'deterministic', 'CONTROL', 'replicate'],
      ['raft', 'local_gc', 'DATA', 'apply'],
      ['deterministic', 'commit', 'ASYNC', 'verify'],
      ['local_gc', 'commit', 'DATA', 'complete'],
      ['commit', 'reclaimed', 'DATA', 'finalize'],
    ],
    sequence: [
      [['epoch', 'leader', '#8C8DFC'], ['epoch', 'gc_proposal', '#627EEA']],
      [['leader', 'gc_proposal', '#8C8DFC']],
      [['gc_proposal', 'raft', '#627EEA']],
      [['raft', 'deterministic', '#8C8DFC'], ['raft', 'local_gc', '#627EEA']],
      [['deterministic', 'commit', '#65c2cb'], ['local_gc', 'commit', '#627EEA']],
      [['commit', 'reclaimed', '#627EEA']],
    ],
  },
  'gc-compaction': {
    nodes: [
      ['journal', 'CONTENT', 70, 240, 'Journal Head', 'Current repository state reference'],
      ['traverse', 'CONSENSUS', 200, 140, 'Tree Traversal', 'Walk content tree from root'],
      ['checkpoints', 'SIGNATURE', 200, 340, 'Checkpoints', 'Async indexing save points'],
      ['old_gen', 'SEGMENT', 370, 90, 'Old Generation', 'Segments in previous generation'],
      ['reachable', 'VALIDATOR', 370, 240, 'Reachability Check', 'Is segment referenced?'],
      ['garbage', 'TRANSACTION', 370, 390, 'Garbage', 'Unreachable segments (70-90%)'],
      ['copy', 'OAK_STORE', 540, 160, 'Copy Live Data', 'Write to new generation segments'],
      ['new_gen', 'SEGMENT', 700, 160, 'New Generation', 'Compacted segments (10-30%)'],
      ['new_journal', 'CONTENT', 700, 320, 'New Journal', 'Updated head reference'],
    ],
    edges: [
      ['journal', 'traverse', 'DATA', 'root'],
      ['journal', 'checkpoints', 'DATA', 'refs'],
      ['traverse', 'old_gen', 'CONTROL', 'read'],
      ['checkpoints', 'reachable', 'DATA', 'mark'],
      ['old_gen', 'reachable', 'DATA', 'check'],
      ['reachable', 'garbage', 'ASYNC', 'unreachable'],
      ['reachable', 'copy', 'DATA', 'live'],
      ['copy', 'new_gen', 'DATA', 'write'],
      ['new_gen', 'new_journal', 'CONTROL', 'commit'],
      ['traverse', 'copy', 'CONTROL', 'compact'],
    ],
    sequence: [
      [['journal', 'traverse', '#627EEA'], ['journal', 'checkpoints', '#627EEA']],
      [['traverse', 'old_gen', '#8C8DFC']],
      [['checkpoints', 'reachable', '#627EEA'], ['old_gen', 'reachable', '#627EEA']],
      [['reachable', 'garbage', '#f85149']],
      [['reachable', 'copy', '#627EEA'], ['traverse', 'copy', '#8C8DFC']],
      [['copy', 'new_gen', '#627EEA']],
      [['new_gen', 'new_journal', '#8C8DFC']],
    ],
  },
  'gc-generations': {
    nodes: [
      ['gen1', 'SEGMENT', 90, 130, 'Generation 1', 'Oldest generation (to be deleted)'],
      ['gen2', 'SEGMENT', 90, 320, 'Generation 2', 'Previous generation (retained)'],
      ['gen3', 'OAK_STORE', 280, 225, 'Generation 3', 'Current generation (active)'],
      ['gc_cycle', 'CONSENSUS', 470, 130, 'GC Cycle', 'Compaction creates new generation'],
      ['gen4', 'OAK_STORE', 660, 225, 'Generation 4', 'New generation after GC'],
      ['delete', 'TRANSACTION', 470, 320, 'Delete Gen 1', 'Oldest generation removed'],
      ['retain', 'VALIDATOR', 660, 370, 'Retain 2 Gens', 'Safety buffer for readers'],
    ],
    edges: [
      ['gen1', 'gc_cycle', 'ASYNC', 'mark old'],
      ['gen2', 'gen3', 'DATA', 'refs'],
      ['gen3', 'gc_cycle', 'DATA', 'compact'],
      ['gc_cycle', 'gen4', 'DATA', 'create'],
      ['gc_cycle', 'delete', 'CONTROL', 'cleanup'],
      ['delete', 'gen1', 'CONTROL', 'remove'],
      ['gen2', 'retain', 'ASYNC', 'keep'],
      ['gen4', 'retain', 'DATA', 'new current'],
    ],
    sequence: [
      [['gen1', 'gc_cycle', '#65c2cb']],
      [['gen2', 'gen3', '#627EEA']],
      [['gen3', 'gc_cycle', '#627EEA']],
      [['gc_cycle', 'gen4', '#627EEA']],
      [['gc_cycle', 'delete', '#8C8DFC']],
      [['delete', 'gen1', '#f85149']],
      [['gen2', 'retain', '#65c2cb'], ['gen4', 'retain', '#627EEA']],
    ],
  },
  'gc-cleanup': {
    nodes: [
      ['tar_files', 'SEGMENT', 70, 205, 'TAR Files', 'Segment archive files on disk'],
      ['scan', 'CONSENSUS', 210, 110, 'Scan TAR', 'Check each segment in TAR'],
      ['live_segs', 'OAK_STORE', 210, 300, 'Live Segments', 'Still referenced by current gen'],
      ['dead_segs', 'TRANSACTION', 390, 205, 'Dead Segments', 'Not referenced, reclaimable'],
      ['rewrite', 'VALIDATOR', 390, 350, 'Rewrite TAR', 'Copy live segments to new TAR'],
      ['mark', 'SIGNATURE', 560, 110, 'Mark Deletable', 'TAR file marked for removal'],
      ['reaper', 'CONSENSUS', 560, 300, 'File Reaper', 'Background deletion thread'],
      ['deleted', 'CONTENT', 730, 205, 'Files Deleted', 'Disk space reclaimed'],
    ],
    edges: [
      ['tar_files', 'scan', 'DATA', 'iterate'],
      ['tar_files', 'live_segs', 'DATA', 'check refs'],
      ['scan', 'dead_segs', 'CONTROL', 'unreachable'],
      ['live_segs', 'rewrite', 'DATA', 'if partial'],
      ['dead_segs', 'mark', 'CONTROL', 'empty TAR'],
      ['rewrite', 'mark', 'ASYNC', 'old TAR'],
      ['mark', 'reaper', 'CONTROL', 'queue'],
      ['reaper', 'deleted', 'DATA', 'unlink'],
    ],
    sequence: [
      [['tar_files', 'scan', '#627EEA'], ['tar_files', 'live_segs', '#627EEA']],
      [['scan', 'dead_segs', '#8C8DFC']],
      [['live_segs', 'rewrite', '#627EEA']],
      [['dead_segs', 'mark', '#8C8DFC'], ['rewrite', 'mark', '#65c2cb']],
      [['mark', 'reaper', '#8C8DFC']],
      [['reaper', 'deleted', '#627EEA']],
    ],
  },
  'gc-modes': {
    nodes: [
      ['gc_trigger', 'VALIDATOR', 70, 160, 'Leader Triggers GC', 'Raft leader initiates GC proposal'],
      ['gc_proposal', 'SIGNATURE', 210, 90, 'GC Proposal', 'Signed proposal for compaction'],
      ['debt_check', 'TRANSACTION', 210, 230, 'GC Debt Check', 'Check entity GC debt accounts'],
      ['raft_replicate', 'CONSENSUS', 390, 160, 'Raft Replication', 'All validators receive GC proposal'],
      ['deterministic', 'VALIDATOR', 560, 90, 'Deterministic Apply', 'All nodes compact identically'],
      ['local_compact', 'OAK_STORE', 560, 230, 'Local Compaction', 'Each validator compacts locally'],
      ['commit', 'TRANSACTION', 730, 160, 'Consensus Commit', 'GC committed to Raft log'],
      ['delete_op', 'AUTHOR', 70, 370, 'Delete Operation', 'Content deletion creates GC debt'],
      ['debt_accrual', 'ETHEREUM', 260, 370, 'Debt Accrual', 'GC cost attributed to entity'],
      ['debt_payment', 'WALLET', 450, 370, 'Debt Payment', 'ETH payment clears GC debt'],
      ['writes_unblocked', 'CONTENT', 640, 370, 'Writes Unblocked', 'Entity can write again'],
    ],
    edges: [
      ['gc_trigger', 'gc_proposal', 'CONTROL', 'create'],
      ['gc_trigger', 'debt_check', 'DATA', 'check'],
      ['gc_proposal', 'raft_replicate', 'DATA', 'broadcast'],
      ['debt_check', 'raft_replicate', 'ASYNC', 'include'],
      ['raft_replicate', 'deterministic', 'CONTROL', 'replicate'],
      ['raft_replicate', 'local_compact', 'DATA', 'apply'],
      ['deterministic', 'commit', 'CONTROL', 'verify'],
      ['local_compact', 'commit', 'DATA', 'complete'],
      ['delete_op', 'debt_accrual', 'DATA', 'incur'],
      ['debt_accrual', 'debt_payment', 'PAYMENT', 'pay ETH'],
      ['debt_payment', 'writes_unblocked', 'CONTROL', 'clear'],
    ],
    sequence: [
      [['gc_trigger', 'gc_proposal', '#8C8DFC'], ['gc_trigger', 'debt_check', '#627EEA']],
      [['gc_proposal', 'raft_replicate', '#627EEA'], ['debt_check', 'raft_replicate', '#65c2cb']],
      [['raft_replicate', 'deterministic', '#8C8DFC'], ['raft_replicate', 'local_compact', '#627EEA']],
      [['deterministic', 'commit', '#8C8DFC'], ['local_compact', 'commit', '#627EEA']],
      [['delete_op', 'debt_accrual', '#627EEA']],
      [['debt_accrual', 'debt_payment', '#f0b429']],
      [['debt_payment', 'writes_unblocked', '#8C8DFC']],
    ],
  },
  'binary-flow': {
    nodes: [
      ['oakchain', 'OAK_STORE', 70, 200, 'Oak-Chain', 'Source of truth: CIDs (46 bytes)'],
      ['cid', 'SIGNATURE', 220, 120, 'CID', 'Content-addressed hash (provenance)'],
      ['author_storage', 'IPFS', 220, 280, 'Author Storage', 'IPFS, Azure Blob, or Pinata'],
      ['binary', 'CONTENT', 400, 200, 'Binary (5MB)', 'Actual file content'],
      ['edge', 'CDN', 580, 200, 'Edge CDN', 'Cloudflare R2, Fastly, etc.'],
      ['user', 'USER', 750, 200, 'End User', 'Verifies CID against oak-chain'],
      ['verify', 'SIGNATURE', 750, 100, 'Verify', 'Hash binary = CID?'],
    ],
    edges: [
      ['oakchain', 'cid', 'DATA', 'stores'],
      ['oakchain', 'author_storage', 'ASYNC', 'references'],
      ['author_storage', 'binary', 'DATA', 'hosts'],
      ['cid', 'binary', 'CONTROL', 'addresses'],
      ['binary', 'edge', 'DATA', 'cache'],
      ['edge', 'user', 'DATA', 'serve'],
      ['user', 'verify', 'CONTROL', 'hash'],
      ['cid', 'verify', 'ASYNC', 'compare'],
    ],
    sequence: [
      [['oakchain', 'cid', '#4ade80']],
      [['oakchain', 'author_storage', '#65c2cb']],
      [['author_storage', 'binary', '#627EEA']],
      [['cid', 'binary', '#8C8DFC']],
      [['binary', 'edge', '#627EEA']],
      [['edge', 'user', '#f48120']],
      [['user', 'verify', '#8C8DFC']],
      [['cid', 'verify', '#65c2cb']],
    ],
  },
  'validator-auth': {
    nodes: [
      ['operator', 'USER', 70, 180, 'Operator', 'Validator operator'],
      ['passkey', 'PASSKEY', 220, 180, 'Passkey', 'WebAuthn credential (Face ID, Touch ID)'],
      ['challenge', 'SIGNATURE', 220, 80, 'Challenge', 'Random nonce from server'],
      ['p256', 'CONSENSUS', 400, 180, 'P-256 Signature', 'Signed challenge'],
      ['verify', 'VALIDATOR', 560, 180, 'Verify', 'Server validates signature'],
      ['wallet', 'WALLET', 560, 80, 'Derived Wallet', 'P-256 pubkey → ETH address'],
      ['dashboard', 'CONTENT', 700, 180, 'Dashboard', 'Authenticated access'],
    ],
    edges: [
      ['operator', 'passkey', 'CONTROL', 'authenticate'],
      ['passkey', 'challenge', 'DATA', 'receive'],
      ['passkey', 'p256', 'DATA', 'sign'],
      ['challenge', 'p256', 'CONTROL', 'include'],
      ['p256', 'verify', 'DATA', 'submit'],
      ['verify', 'wallet', 'ASYNC', 'derive'],
      ['verify', 'dashboard', 'CONTROL', 'grant'],
    ],
    sequence: [
      [['operator', 'passkey', '#627EEA']],
      [['passkey', 'challenge', '#a855f7']],
      [['passkey', 'p256', '#a855f7']],
      [['challenge', 'p256', '#8C8DFC']],
      [['p256', 'verify', '#627EEA']],
      [['verify', 'wallet', '#65c2cb']],
      [['verify', 'dashboard', '#4ade80']],
    ],
  },
  'json-to-jcr': {
    nodes: [
      ['json', 'CONTENT', 70, 110, 'message JSON', 'Raw JSON payload'],
      ['parser', 'SEGMENT', 220, 110, 'JSON Parser', 'Parse + validate'],
      ['mapper', 'CONTENT', 370, 110, 'Mapping Rules', 'Scalars → props, objects → nodes'],
      ['jcr', 'OAK_STORE', 520, 110, 'JCR Node', 'Materialized content node'],
      ['props', 'CONTENT', 700, 60, 'Properties', 'Scalars + arrays of scalars', 22],
      ['children', 'CONTENT', 700, 160, 'Child Nodes', 'Objects + arrays of objects', 22],
      ['wallet', 'WALLET', 70, 300, 'Wallet', '0x...'],
      ['org', 'AUTHOR', 220, 300, 'Organization', 'Brand scope'],
      ['ctype', 'CONTENT', 370, 300, 'Content Type', 'page, asset, ...'],
      ['time', 'TRANSACTION', 520, 300, 'Timestamp', 'contentType-{timestamp}'],
      ['path', 'SEGMENT', 670, 300, 'Path Builder', 'Shard + wallet + org'],
      ['pathOut', 'OAK_STORE', 820, 300, 'Content Path', '/oak-chain/.../content/*', 24],
    ],
    edges: [
      ['json', 'parser', 'DATA', 'parse'],
      ['parser', 'mapper', 'CONTROL', 'apply rules'],
      ['mapper', 'jcr', 'DATA', 'materialize'],
      ['jcr', 'props', 'DATA', 'scalars'],
      ['jcr', 'children', 'DATA', 'objects'],
      ['wallet', 'path', 'CONTROL', 'wallet'],
      ['org', 'path', 'CONTROL', 'org'],
      ['ctype', 'path', 'CONTROL', 'type'],
      ['time', 'path', 'CONTROL', 'time'],
      ['path', 'pathOut', 'DATA', 'derive'],
      ['pathOut', 'jcr', 'ASYNC', 'location'],
    ],
    sequence: [
      [['json', 'parser', '#627EEA']],
      [['parser', 'mapper', '#8C8DFC']],
      [['mapper', 'jcr', '#627EEA']],
      [['jcr', 'props', '#e6edf3'], ['jcr', 'children', '#e6edf3']],
      [['wallet', 'path', '#f0b429'], ['org', 'path', '#8C8DFC']],
      [['ctype', 'path', '#627EEA'], ['time', 'path', '#4ade80']],
      [['path', 'pathOut', '#627EEA']],
      [['pathOut', 'jcr', '#65c2cb']],
    ],
  },
};

const SVG_NS = 'http://www.w3.org/2000/svg';
const DEFAULT_RADIUS = 28;

function buildNode(spec) {
  const [id, type, x, y, label, description, radius] = spec;
  const t = NODE_TYPES[type] || NODE_TYPES.CONTENT;
  return {
    id,
    type,
    x,
    y,
    label,
    description,
    icon: t.icon,
    color: t.color,
    radius: radius || DEFAULT_RADIUS,
  };
}

function buildEdge(spec) {
  const [from, to, type, label] = spec;
  return {
    from, to, type, label, color: EDGE_COLORS[type] || EDGE_COLORS.DATA,
  };
}

function edgeGeometry(edge, nodes) {
  const a = nodes.find((n) => n.id === edge.from);
  const b = nodes.find((n) => n.id === edge.to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const offA = a.radius + 8;
  const offB = b.radius + 8;
  const sx = a.x + (dx / dist) * offA;
  const sy = a.y + (dy / dist) * offA;
  const ex = b.x - (dx / dist) * offB;
  const ey = b.y - (dy / dist) * offB;
  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2;
  const cv = 0.2;
  const cx = mx - dy * cv;
  const cy = my + dx * cv;
  return {
    sx, sy, ex, ey, cx, cy, mx: cx, my: cy - 12,
  };
}

function dasharray(type) {
  if (type === 'CONTROL') return '8 4';
  if (type === 'ASYNC') return '4 4';
  return 'none';
}

function svgEl(name, attrs = {}, text = null) {
  const el = document.createElementNS(SVG_NS, name);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  if (text != null) el.textContent = text;
  return el;
}

function renderFlow(container, flowName) {
  const flow = FLOWS[flowName];
  if (!flow) {
    container.textContent = `Unknown flow: ${flowName}`;
    return null;
  }
  const nodes = flow.nodes.map(buildNode);
  const edges = flow.edges.map(buildEdge);
  const width = FLOW_WIDTHS[flowName] || 850;
  const height = 360;

  const svg = svgEl('svg', {
    viewBox: `0 0 ${width} ${height}`,
    class: 'flow-graph-svg',
    role: 'img',
    'aria-label': `Flow diagram: ${flowName}`,
  });

  // defs
  const defs = svgEl('defs');
  const marker = svgEl('marker', {
    id: `flow-arrow-${flowName}`, markerWidth: 10, markerHeight: 7, refX: 9, refY: 3.5, orient: 'auto',
  });
  marker.appendChild(svgEl('polygon', { points: '0 0, 10 3.5, 0 7', fill: '#627EEA' }));
  defs.appendChild(marker);
  svg.appendChild(defs);

  // edges
  const edgeGroup = svgEl('g', { class: 'flow-graph-edges' });
  edges.forEach((edge) => {
    const g = edgeGeometry(edge, nodes);
    edgeGroup.appendChild(svgEl('path', {
      d: `M ${g.sx} ${g.sy} Q ${g.cx} ${g.cy} ${g.ex} ${g.ey}`,
      fill: 'none',
      stroke: edge.color,
      'stroke-width': 2,
      'stroke-dasharray': dasharray(edge.type),
      'marker-end': `url(#flow-arrow-${flowName})`,
      class: 'flow-graph-edge',
    }));
    if (edge.label) {
      edgeGroup.appendChild(svgEl('text', {
        x: g.mx, y: g.my, 'text-anchor': 'middle', class: 'flow-graph-edge-label',
      }, edge.label));
    }
  });
  svg.appendChild(edgeGroup);

  // nodes
  const nodeGroup = svgEl('g', { class: 'flow-graph-nodes' });
  nodes.forEach((node) => {
    const g = svgEl('g', {
      transform: `translate(${node.x}, ${node.y})`,
      class: 'flow-graph-node',
      'data-node-id': node.id,
      tabindex: '0',
    });
    g.appendChild(svgEl('circle', {
      r: node.radius + 8, fill: 'none', stroke: node.color, 'stroke-width': 1, class: 'flow-graph-node-glow',
    }));
    g.appendChild(svgEl('circle', {
      r: node.radius, fill: '#1a1a2e', stroke: node.color, 'stroke-width': 2, class: 'flow-graph-node-circle',
    }));
    g.appendChild(svgEl('text', {
      'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 18, class: 'flow-graph-node-icon',
    }, node.icon));
    g.appendChild(svgEl('text', {
      'text-anchor': 'middle', y: node.radius + 18, class: 'flow-graph-node-label',
    }, node.label));
    nodeGroup.appendChild(g);
  });
  svg.appendChild(nodeGroup);

  // packets layer
  const packetGroup = svgEl('g', { class: 'flow-graph-packets' });
  svg.appendChild(packetGroup);

  // info panel
  const info = document.createElement('div');
  info.className = 'flow-graph-info';
  info.hidden = true;

  function showInfo(node) {
    info.innerHTML = `
      <div class="flow-graph-info-header">
        <span class="flow-graph-info-icon">${node.icon}</span>
        <span class="flow-graph-info-title">${node.label}</span>
      </div>
      ${node.description ? `<p class="flow-graph-info-desc">${node.description}</p>` : ''}
    `;
    info.hidden = false;
  }

  function hideInfo() { info.hidden = true; }

  nodeGroup.querySelectorAll('.flow-graph-node').forEach((g) => {
    const id = g.getAttribute('data-node-id');
    const node = nodes.find((n) => n.id === id);
    g.addEventListener('mouseenter', () => showInfo(node));
    g.addEventListener('focus', () => showInfo(node));
    g.addEventListener('mouseleave', hideInfo);
    g.addEventListener('blur', hideInfo);
  });

  container.appendChild(svg);
  container.appendChild(info);

  return {
    svg, packetGroup, nodes, flow,
  };
}

function animateFlow({ packetGroup, nodes, flow }) {
  const seq = flow.sequence || [];
  const stepDuration = 600;
  const stepGap = 200;

  function packet(fromId, toId, color) {
    return new Promise((resolve) => {
      const a = nodes.find((n) => n.id === fromId);
      const b = nodes.find((n) => n.id === toId);
      if (!a || !b) { resolve(); return; }
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const offA = a.radius + 8;
      const offB = b.radius + 8;
      const sx = a.x + (dx / dist) * offA;
      const sy = a.y + (dy / dist) * offA;
      const ex = b.x - (dx / dist) * offB;
      const ey = b.y - (dy / dist) * offB;
      const cv = 0.2;
      const cx = (sx + ex) / 2 - dy * cv;
      const cy = (sy + ey) / 2 + dx * cv;

      const dot = svgEl('circle', {
        cx: sx, cy: sy, r: 6, fill: color, class: 'flow-graph-packet',
      });
      packetGroup.appendChild(dot);
      const start = performance.now();
      function step(now) {
        const t = Math.min((now - start) / stepDuration, 1);
        const u = 1 - t;
        const x = u * u * sx + 2 * u * t * cx + t * t * ex;
        const y = u * u * sy + 2 * u * t * cy + t * t * ey;
        dot.setAttribute('cx', x);
        dot.setAttribute('cy', y);
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          dot.remove();
          resolve();
        }
      }
      requestAnimationFrame(step);
    });
  }

  const wait = (ms) => new Promise((r) => { setTimeout(r, ms); });
  return seq.reduce(
    (chain, step) => chain
      .then(() => Promise.all(step.map(([from, to, color]) => packet(from, to, color))))
      .then(() => wait(stepGap)),
    Promise.resolve(),
  );
}

export default function decorate(block) {
  // Extract flow name from first cell.
  const cells = block.querySelectorAll(':scope > div > div');
  const flowName = (cells[0]?.textContent || 'two-models').trim();

  block.textContent = '';
  block.classList.add(`flow-graph-${flowName}`);

  const wrapper = document.createElement('div');
  wrapper.className = 'flow-graph-wrapper';

  const controls = document.createElement('div');
  controls.className = 'flow-graph-controls';
  const playBtn = document.createElement('button');
  playBtn.type = 'button';
  playBtn.className = 'flow-graph-play';
  playBtn.innerHTML = '<span aria-hidden="true">▶</span><span>Play animation</span>';
  controls.appendChild(playBtn);

  const stage = document.createElement('div');
  stage.className = 'flow-graph-stage';

  wrapper.append(controls, stage);
  block.appendChild(wrapper);

  const ctx = renderFlow(stage, flowName);
  if (!ctx) {
    playBtn.disabled = true;
    return;
  }

  let running = false;
  playBtn.addEventListener('click', async () => {
    if (running) return;
    running = true;
    playBtn.disabled = true;
    playBtn.querySelector('span:last-child').textContent = 'Playing…';
    try {
      await animateFlow(ctx);
    } finally {
      running = false;
      playBtn.disabled = false;
      playBtn.querySelector('span:last-child').textContent = 'Play animation';
    }
  });
}
