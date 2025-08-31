import { EndpointKind } from "../const/endpoint-kind";

/**
 * Interface representing an extracted SPARQL endpoint.
 */
export interface ExtractedEndpoint {
    kind: EndpointKind;
    endpoint: string;
}
