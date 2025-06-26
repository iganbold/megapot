import { GraphQLClient } from 'graphql-request';
import { config } from '@/lib/config';

// MegaPot subgraph client (hosted on Goldsky)
export const megapotClient = new GraphQLClient(config.megapotSubgraphUrl); 