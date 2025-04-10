import React from 'react';
import { Table } from 'react-bootstrap';
import { useIraCcDashboardLogic } from '../mechanisms/IraCcDashboard';
import '../components/css/IraCcDashboard.css';

function IraCcDashboard({ iraData, ccData, snapshotInfo }) {
  const {
    iraStats,
    ccStats,
    currentWeek,
    exportAsExcel,
    createEmailDraft,
    getBranchShortName,
    VALID_BRANCHES
  } = useIraCcDashboardLogic({ iraData, ccData, snapshotInfo });

  const renderBranchTable = () => {
    const sortedBranches = [...VALID_BRANCHES].sort((a, b) => {
      const aPercentage = iraStats.branchPercentages.find((x) => x.branch === a)?.percentage || 0;
      const bPercentage = iraStats.branchPercentages.find((x) => x.branch === b)?.percentage || 0;
      return bPercentage - aPercentage;
    });

    return (
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>No.</th>
            <th>Branch</th>
            <th>IRA %</th>
            <th>IRA Status</th>
            <th>CC %</th>
            <th>CC Status</th>
          </tr>
        </thead>
        <tbody>
          {sortedBranches.map((branch, index) => {
            const iraPercentage = iraStats.branchPercentages.find((x) => x.branch === branch)?.percentage || 0;
            const ccPercentage = ccStats.branchPercentages.find((x) => x.branch === branch)?.percentage || 0;
            const iraStatus = iraPercentage >= (currentWeek?.ira?.target || 95) ? 'On Target' : 'Below Target';
            const ccStatus = ccPercentage >= (currentWeek?.cc?.target || 95) ? 'On Target' : 'Below Target';

            return (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{getBranchShortName(branch)}</td>
                <td>{iraPercentage.toFixed(2)}%</td>
                <td>{iraStatus}</td>
                <td>{ccPercentage.toFixed(2)}%</td>
                <td>{ccStatus}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    );
  };

  return (
    <div className="dashboard-container">
      <h2>IRA & CC Dashboard</h2>
      {renderBranchTable()}
      <button onClick={exportAsExcel}>Export as Excel</button>
      <button onClick={createEmailDraft}>Create Email Draft</button>
    </div>
  );
}

export default IraCcDashboard;
