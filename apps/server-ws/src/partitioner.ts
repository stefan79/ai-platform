import { Partitioners } from 'kafkajs';

export const createEnvelopePartitioner = () => {
  const fallback = Partitioners.DefaultPartitioner();

  return (args: Parameters<ReturnType<typeof Partitioners.DefaultPartitioner>>[0]) => {
    const { message, partitionMetadata } = args;
    const value = message.value;
    let envelopePartition: number | undefined;

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value) as { partition?: number };
        envelopePartition = parsed.partition;
      } catch {
        envelopePartition = undefined;
      }
    } else if (Buffer.isBuffer(value)) {
      try {
        const parsed = JSON.parse(value.toString('utf8')) as { partition?: number };
        envelopePartition = parsed.partition;
      } catch {
        envelopePartition = undefined;
      }
    }

    if (
      typeof envelopePartition === 'number' &&
      Number.isInteger(envelopePartition) &&
      envelopePartition >= 0 &&
      envelopePartition < partitionMetadata.length
    ) {
      return envelopePartition;
    }

    return fallback(args);
  };
};
