import { loadLocalEnv } from "@/lib/env/loadLocalEnv";
import { CorpusRepository } from "@/lib/repositories/corpusRepository";
import {
  generateProfileFromCorpus,
  materializeGeneratedProfile,
  PROFILE_SYNTHESIS_PROMPT_VERSION
} from "@/lib/profile/profileGenerator";

loadLocalEnv();

type Args = {
  tenant: string;
  slug: string;
  ownerUid: string;
  displayName: string;
  locationLabel: string;
  availabilityLabel: string;
  bookingUrl: string;
  interestCaptureUrl: string;
  maxChunks: number;
  maxContextChars: number;
  publish: boolean;
};

function argValue(name: string, fallback?: string) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function hasFlag(name: string) {
  return process.argv.includes(name);
}

function parseArgs(): Args {
  return {
    tenant: argValue("--tenant", "founder-mjk") ?? "founder-mjk",
    slug: argValue("--slug", "mjk") ?? "mjk",
    ownerUid: argValue("--owner-uid", "owner-mjk") ?? "owner-mjk",
    displayName: argValue("--display-name", "Muhammad Khan") ?? "Muhammad Khan",
    locationLabel: argValue("--location", "Cape Town, South Africa") ?? "Cape Town, South Africa",
    availabilityLabel: argValue("--availability", "Available for selected conversations") ?? "Available for selected conversations",
    bookingUrl: argValue("--booking-url", "") ?? "",
    interestCaptureUrl: argValue("--interest-url", "") ?? "",
    maxChunks: Number(argValue("--max-chunks", "120")),
    maxContextChars: Number(argValue("--max-context-chars", "90000")),
    publish: hasFlag("--publish")
  };
}

async function main() {
  const args = parseArgs();
  const repository = new CorpusRepository();
  const records = await repository.readCorpusChunks(args.tenant, args.maxChunks);

  if (!records.length) {
    throw new Error(`No source chunks found for tenant ${args.tenant}. Run npm run ingest:local first.`);
  }

  const agentRunId = await repository.createAgentRun({
    tenantId: args.tenant,
    runType: "profile_synthesis",
    model: "pending",
    modelVersion: "pending",
    promptVersion: PROFILE_SYNTHESIS_PROMPT_VERSION,
    createdBy: args.ownerUid
  });

  try {
    const generated = await generateProfileFromCorpus(records, {
      displayName: args.displayName,
      locationLabel: args.locationLabel,
      availabilityLabel: args.availabilityLabel,
      maxContextChars: args.maxContextChars
    });
    const materialized = materializeGeneratedProfile(generated.profile, {
      tenantId: args.tenant,
      slug: args.slug,
      ownerUid: args.ownerUid,
      publish: args.publish,
      bookingUrl: args.bookingUrl,
      interestCaptureUrl: args.interestCaptureUrl,
      agentRunId,
      model: generated.model,
      modelVersion: generated.modelVersion
    });

    await repository.writeGeneratedProfile(materialized);
    await repository.completeAgentRun(args.tenant, agentRunId, {
      model: generated.model,
      modelVersion: generated.modelVersion,
      published: args.publish,
      generationFingerprint: materialized.generationFingerprint,
      sectionCount: generated.profile.sections.length,
      claimCount: generated.profile.claims.length,
      missingContextQuestions: generated.profile.missingContextQuestions
    });

    console.log(
      JSON.stringify(
        {
          tenant: args.tenant,
          slug: args.slug,
          agentRunId,
          model: generated.model,
          modelVersion: generated.modelVersion,
          published: args.publish,
          sections: generated.profile.sections.length,
          claims: generated.profile.claims.length,
          publicUrl: args.publish ? `/p/${args.slug}` : null,
          missingContextQuestions: generated.profile.missingContextQuestions
        },
        null,
        2
      )
    );
  } catch (caught) {
    const errorSummary = caught instanceof Error ? caught.message : "Unknown profile generation error";
    await repository.failAgentRun(args.tenant, agentRunId, errorSummary);
    throw caught;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
