from datetime import datetime
from sqlalchemy import Boolean, ForeignKey, DateTime, Integer, String , Text
from sqlalchemy.orm import relationship , mapped_column , Mapped
from database.connection import Base


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False , index=True)
    department: Mapped[str| None] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True , nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime , default = datetime.utcnow , nullable=False)

    simulations: Mapped[list["Simulation"]] = relationship(
        back_populates="employee"
    )
    trainings: Mapped[list["Training"]] = relationship(
        back_populates="employee"
    )

class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[int] = mapped_column(Integer , primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150) , nullable=False)
    description: Mapped[str| None] = mapped_column(Text , nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime , default = datetime.utcnow , nullable=False)
    simulations: Mapped[list["Simulation"]] = relationship(
        back_populates="campaign"
    )

class Simulation(Base):
    __tablename__ = "simulations"

    id: Mapped[int] = mapped_column(Integer , primary_key=True, index=True)
    employee_id: Mapped[int] = mapped_column(Integer , ForeignKey("employees.id") , nullable=False)
    campaign_id: Mapped[int] = mapped_column(Integer , ForeignKey("campaigns.id") , nullable=False)
    email_subject: Mapped[str] = mapped_column(String(255) , nullable=False)
    phishing_type: Mapped[str] = mapped_column(String(50) , nullable=False)
    status: Mapped[str] = mapped_column(String(50) , default="sent" , nullable=False)
    clicked: Mapped[bool] = mapped_column(Boolean , default=False , nullable=False)
    reported: Mapped[bool] = mapped_column(Boolean , default=False , nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime , default = datetime.utcnow , nullable=False)
    employee: Mapped["Employee"] = relationship(
        back_populates="simulations")
    campaign: Mapped["Campaign"] = relationship(
        back_populates="simulations")
    events: Mapped[list["Event"]] = relationship(
        back_populates="simulation"
    )
    trainings: Mapped[list["Training"]] = relationship(
        back_populates="simulation")

class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer , primary_key=True, index=True)
    simulation_id: Mapped[int] = mapped_column(Integer , ForeignKey("simulations.id") , nullable=False)
    event_type: Mapped[str] = mapped_column(String(50) , nullable=False)
    description: Mapped[str| None] = mapped_column(Text , nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime , default = datetime.utcnow , nullable=False)
    simulation: Mapped["Simulation"] = relationship(
        back_populates="events")

class Training(Base):
    __tablename__ = "trainings"
    id: Mapped[int] = mapped_column(Integer , primary_key=True, index=True)
    employee_id: Mapped[int] = mapped_column(Integer , ForeignKey("employees.id") , nullable=False)
    simulation_id: Mapped[int] = mapped_column(Integer , ForeignKey("simulations.id") , nullable=False)
    title: Mapped[str] = mapped_column(String(155) , nullable=False)
    content: Mapped[str] = mapped_column(Text , nullable=True)
    completed: Mapped[bool] = mapped_column(Boolean , default=False , nullable=False)
    completed_at: Mapped[datetime| None] = mapped_column(DateTime , nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime , default = datetime.utcnow , nullable=False)
    employee: Mapped["Employee"] = relationship(
        back_populates="trainings")
    simulation: Mapped["Simulation"] = relationship(
        back_populates="trainings")
    