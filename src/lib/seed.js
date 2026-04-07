import {
  campaigns as sampleCampaigns,
  characters as sampleCharacters,
  inventory as sampleInventory,
  journalPlaceholders,
  knowledge as sampleKnowledge,
  locations as sampleLocations,
  quests as sampleQuests,
  sessions as sampleSessions,
} from "../data";

const statusMap = {
  Activa: "active",
  Pausada: "paused",
  Finalizada: "finished",
};

const questStatusMap = {
  Activa: "active",
  Investigando: "investigating",
  Completada: "completed",
  Pausada: "paused",
};

const knowledgeKindMap = {
  Privado: "private",
  Grupo: "group",
  Rumor: "rumor",
};

export function createStarterCampaignPayload(userId) {
  const campaign = sampleCampaigns[0];

  return {
    owner_user_id: userId,
    title: campaign.name,
    status: statusMap[campaign.status] || "active",
    setting: campaign.setting,
    summary: campaign.summary,
    focus: campaign.focus,
    next_move: campaign.nextMove,
    last_session_label: campaign.lastSession,
    accent: campaign.accent,
  };
}

export function createStarterBundle(campaignId, userId) {
  return {
    characters: sampleCharacters.map((item, index) => ({
      campaign_id: campaignId,
      created_by: userId,
      updated_by: userId,
      name: item.name,
      role_label: item.role,
      tag: item.tag,
      summary: item.note,
      is_pinned: index < 2,
      sort_order: index,
    })),
    quests: sampleQuests.map((item, index) => ({
      campaign_id: campaignId,
      created_by: userId,
      updated_by: userId,
      title: item.title,
      status: questStatusMap[item.status] || "active",
      detail: item.detail,
      priority: index === 0 ? 3 : 1,
      sort_order: index,
    })),
    locations: sampleLocations.map((item, index) => ({
      campaign_id: campaignId,
      created_by: userId,
      updated_by: userId,
      title: item.title,
      location_type: item.type,
      detail: item.detail,
      is_safe_haven: item.type === "Refugio",
      sort_order: index,
    })),
    knowledge_entries: sampleKnowledge.map((item, index) => ({
      campaign_id: campaignId,
      created_by: userId,
      updated_by: userId,
      owner_user_id: item.kind === "Privado" ? userId : null,
      title: item.title,
      body: item.text,
      kind: knowledgeKindMap[item.kind] || "group",
      visibility: item.kind === "Privado" ? "private" : "campaign",
      sort_order: index,
    })),
    session_logs: sampleSessions.map((item, index) => ({
      campaign_id: campaignId,
      created_by: userId,
      updated_by: userId,
      title: item.title,
      recap: item.detail,
      session_number: sampleSessions.length - index,
      sort_order: index,
    })),
    inventory_items: sampleInventory.map((item, index) => ({
      campaign_id: campaignId,
      created_by: userId,
      updated_by: userId,
      name: item.name,
      item_type: item.meta,
      holder: item.holder,
      notes: item.meta,
      quantity: 1,
      sort_order: index,
    })),
    journal_entries: [
      {
        campaign_id: campaignId,
        authored_by: userId,
        updated_by: userId,
        title: "Bitácora principal",
        body: (journalPlaceholders[1] || []).join("\n\n"),
        entry_type: "note",
        is_pinned: true,
        sort_order: 0,
      },
    ],
  };
}
