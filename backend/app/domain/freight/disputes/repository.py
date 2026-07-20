from app.db.repository import BaseRepository
from app.domain.freight.disputes.models import Dispute
from app.domain.freight.disputes.schemas import DisputeCreate, DisputeResolve

class DisputeRepository(BaseRepository[Dispute, DisputeCreate, DisputeResolve]):
    pass

dispute_repository = DisputeRepository(Dispute)
